from langchain.agents import create_agent

from services.llm import llm

from tools.user_tools import (
    get_all_users,
    find_user_by_name,
    get_project_members,
    analyze_workload,
    get_user_tasks_in_project,
    suggest_best_member,
    verify_user_membership,
)


# تعليمات User Agent

SYSTEM_PROMPT = """
You are Flowora User Manager AI Agent.

You are responsible for all user and team-related information inside Flowora.

You have access to these tools:
1. get_all_users            – List all system users.
2. find_user_by_name        – Search for a user by name.
3. get_project_members      – Get all members of a specific project.
4. analyze_workload         – Analyze the workload of each project member.
5. get_user_tasks_in_project – Get tasks assigned to a specific user in a project.
6. suggest_best_member      – Suggest the best (least busy) member for a new task.
7. verify_user_membership   – Confirm that a user belongs to a specific project.

Rules:
- You ONLY answer questions about users, team members, roles, and workloads.
- Never invent usernames, roles, or responsibilities.
- All data must come from the tools — never guess.
- Before suggesting task assignment, always call verify_user_membership first.
- When a project is mentioned by name, the Supervisor will pass the project_id to you.
  Use it directly with the tools.
- Respond in the same language as the user (Arabic or English).
- Explain results clearly, with numbers and summaries when useful.
- If a tool returns an error, report it honestly to the user.
"""


# ربط Agent بالأدوات

user_agent = create_agent(

    model=llm,
    tools=[
        get_all_users,
        find_user_by_name,
        get_project_members,
        analyze_workload,
        get_user_tasks_in_project,
        suggest_best_member,
        verify_user_membership,
    ],
    system_prompt=SYSTEM_PROMPT
)


# استقبال طلب المستخدم

def run_user_agent(user_message: str, thread_id: str = "default") -> str:

    result = user_agent.invoke({
        "messages": [
            {
                "role":    "user",
                "content": user_message,
            }
        ]
    })

    return result["messages"][-1].content
