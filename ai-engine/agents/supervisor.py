"""
Flowora Multi-Agent Supervisor
===============================
LangGraph workflow that:
  1. Receives the user request.
  2. Routes it to Task Agent or User Agent (or both).
  3. Maintains conversation memory per thread_id.
  4. Requires human approval before any DB-modifying action.
  5. Returns the final response.
"""

from typing import TypedDict, Annotated, Literal
import operator

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from agents.task_manager import task_manager_agent
from agents.user_agent   import user_agent


# ─── LLM للـ Supervisor (نفس النموذج) ─────────────────────────────────────
supervisor_llm = ChatOllama(model="qwen3:8b", temperature=0.1)


# ─── State المشترك ─────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages:         Annotated[list, operator.add]  # تاريخ المحادثة
    next_agent:       str                            # task | user | both | end
    task_response:    str
    user_response:    str
    final_response:   str
    pending_action:   dict                           # للعمليات التي تحتاج موافقة
    user_approved:    bool
    project_id:       int
    thread_id:        str


# ─── 1. Router Node ────────────────────────────────────────────────────────
ROUTER_PROMPT = """
You are a supervisor routing user requests to the right AI agent.

Agents available:
- "task"  → handles: tasks, deadlines, priorities, task creation, status changes, overdue tasks, task statistics.
- "user"  → handles: team members, users, roles, workload, who is least busy, assigning tasks to members.
- "both"  → needed when the request requires BOTH task data AND user data 
            (e.g., "who is least busy and what tasks do they have?").

Respond with ONLY one word: task | user | both

User request: {message}
"""


def router_node(state: AgentState) -> dict:
    """Decide which agent(s) should handle the request."""

    last_human = ""
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            last_human = msg.content
            break

    prompt = ROUTER_PROMPT.format(message=last_human)
    decision = supervisor_llm.invoke(prompt).content.strip().lower()

    # تنظيف الإجابة
    if "both" in decision:
        route = "both"
    elif "user" in decision:
        route = "user"
    else:
        route = "task"

    return {"next_agent": route}


# ─── 2. Task Agent Node ────────────────────────────────────────────────────
def task_node(state: AgentState) -> dict:
    """Run the Task Manager agent."""

    # بناء السياق كاملاً مع تاريخ المحادثة
    history = _build_history(state["messages"], limit=10)
    project_ctx = f"[Current project_id: {state.get('project_id', 'unknown')}]\n\n"

    result = task_manager_agent.invoke({
        "messages": history
    })

    response = result["messages"][-1].content

    return {
        "task_response": response,
        "messages":      [AIMessage(content=f"[Task Agent]: {response}")],
    }


# ─── 3. User Agent Node ────────────────────────────────────────────────────
def user_node(state: AgentState) -> dict:
    """Run the User Manager agent."""

    history = _build_history(state["messages"], limit=10)

    result = user_agent.invoke({
        "messages": history
    })

    response = result["messages"][-1].content

    return {
        "user_response": response,
        "messages":      [AIMessage(content=f"[User Agent]: {response}")],
    }


# ─── 4. Both Node (تنفيذ كلا الوكيلين ثم دمج) ────────────────────────────
def both_node(state: AgentState) -> dict:
    """Run both agents and merge their responses."""

    history = _build_history(state["messages"], limit=10)

    task_result = task_manager_agent.invoke({"messages": history})
    task_resp   = task_result["messages"][-1].content

    user_result = user_agent.invoke({"messages": history})
    user_resp   = user_result["messages"][-1].content

    return {
        "task_response": task_resp,
        "user_response": user_resp,
        "messages": [
            AIMessage(content=f"[Task Agent]: {task_resp}"),
            AIMessage(content=f"[User Agent]: {user_resp}"),
        ],
    }


# ─── 5. Human Approval Gate ────────────────────────────────────────────────
MUTATING_KEYWORDS = [
    "create", "أنشئ", "أضف", "add",
    "change", "غير", "عدّل", "update",
    "delete", "احذف", "remove",
    "assign", "أسند",
]


def approval_check_node(state: AgentState) -> dict:
    """
    Detect if the user's request is a DB-modifying action.
    If yes, set pending_action so the caller can ask for confirmation.
    """

    last_human = ""
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            last_human = msg.content.lower()
            break

    needs_approval = any(kw in last_human for kw in MUTATING_KEYWORDS)

    if needs_approval and not state.get("user_approved"):
        return {
            "pending_action": {
                "request":     last_human,
                "needs_human": True,
            }
        }

    return {"pending_action": {}, "user_approved": False}


# ─── 6. Merge / Final Response Node ───────────────────────────────────────
def merge_node(state: AgentState) -> dict:
    """
    Combine responses from one or both agents into a single final answer.
    If both ran, ask the LLM to synthesize a coherent combined answer.
    """

    task_resp = state.get("task_response", "")
    user_resp = state.get("user_response", "")

    if task_resp and user_resp:
        # دمج ذكي
        merge_prompt = f"""
You are Flowora AI Assistant. Combine the following two agent responses into 
one clear, coherent answer for the user. Remove redundancy. 
Respond in the same language as the user (Arabic/English).

Task Agent response:
{task_resp}

User Agent response:
{user_resp}

Write the final combined answer:
"""
        combined = supervisor_llm.invoke(merge_prompt).content.strip()
        final    = combined
    elif task_resp:
        final = task_resp
    elif user_resp:
        final = user_resp
    else:
        final = "لم أتمكن من معالجة طلبك، يرجى المحاولة مجدداً."

    return {
        "final_response": final,
        "messages":       [AIMessage(content=final)],
    }


# ─── Helper: بناء تاريخ المحادثة ───────────────────────────────────────────
def _build_history(messages: list, limit: int = 10) -> list:
    """Return the last `limit` messages as LangChain message objects."""
    return messages[-limit:] if len(messages) > limit else messages


# ─── تجميع الـ Graph ───────────────────────────────────────────────────────
def _route_after_approval(state: AgentState) -> Literal["task", "user", "both"]:
    return state["next_agent"]


def build_supervisor_graph():
    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("router",          router_node)
    graph.add_node("approval_check",  approval_check_node)
    graph.add_node("task",            task_node)
    graph.add_node("user",            user_node)
    graph.add_node("both",            both_node)
    graph.add_node("merge",           merge_node)

    # Entry point
    graph.set_entry_point("router")

    # Router → Approval check
    graph.add_edge("router", "approval_check")

    # Approval check → agents
    graph.add_conditional_edges(
        "approval_check",
        _route_after_approval,
        {
            "task": "task",
            "user": "user",
            "both": "both",
        }
    )

    # Agents → Merge
    graph.add_edge("task", "merge")
    graph.add_edge("user", "merge")
    graph.add_edge("both", "merge")

    # Merge → END
    graph.add_edge("merge", END)

    # Memory (conversation history per thread_id)
    memory = MemorySaver()

    return graph.compile(checkpointer=memory)


# Singleton
supervisor_graph = build_supervisor_graph()


# ─── Public Entry Point ────────────────────────────────────────────────────
def run_supervisor(
    user_message:  str,
    project_id:    int  = 1,
    thread_id:     str  = "default",
    user_approved: bool = False,
) -> dict:
    """
    Main entry point called by FastAPI.

    Returns:
        {
          "response":       str,          # النص النهائي للمستخدم
          "pending_action": dict | None,  # يُملأ إذا احتاج الأمر لموافقة
          "agent_used":     str,          # task | user | both
        }
    """

    config = {"configurable": {"thread_id": thread_id}}

    initial_state: AgentState = {
        "messages":       [HumanMessage(content=user_message)],
        "next_agent":     "task",
        "task_response":  "",
        "user_response":  "",
        "final_response": "",
        "pending_action": {},
        "user_approved":  user_approved,
        "project_id":     project_id,
        "thread_id":      thread_id,
    }

    result = supervisor_graph.invoke(initial_state, config=config)

    pending = result.get("pending_action", {})

    return {
        "response":       result.get("final_response", ""),
        "pending_action": pending if pending.get("needs_human") else None,
        "agent_used":     result.get("next_agent", "task"),
    }
