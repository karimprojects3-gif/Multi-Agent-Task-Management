"""
Flowora AI Engine  –  FastAPI Entry Point
==========================================
Routes:
  POST /chat          → Main chat endpoint (Supervisor)
  POST /chat/approve  → User approves a pending action
  GET  /              → Health check
"""

import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from agents.supervisor import run_supervisor


app = FastAPI(title="Flowora AI Engine")


# ─── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message:    str
    project_id: int   = Field(default=1, ge=1)
    thread_id:  Optional[str] = None     # يُنشئ تلقائياً إذا لم يُرسل


class ApprovalRequest(BaseModel):
    thread_id:  str
    project_id: int = Field(default=1, ge=1)
    message:    str
    approved:   bool


class ChatResponse(BaseModel):
    response:       str
    thread_id:      str
    agent_used:     str
    pending_action: Optional[dict] = None


# ─── POST /chat ────────────────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
def chat(data: ChatRequest):
    """Main endpoint: routes the message through the Multi-Agent Supervisor."""

    # إنشاء thread_id إذا لم يُرسل (محادثة جديدة)
    thread_id = data.thread_id or str(uuid.uuid4())

    try:
        result = run_supervisor(
            user_message=data.message,
            project_id=data.project_id,
            thread_id=thread_id,
            user_approved=False,
        )
    except ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama service is unavailable. Make sure Ollama is running with: ollama serve"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Engine error: {str(e)}"
        )

    return ChatResponse(
        response=result["response"],
        thread_id=thread_id,
        agent_used=result.get("agent_used", "task"),
        pending_action=result.get("pending_action"),
    )


# ─── POST /chat/approve ────────────────────────────────────────────────────
@app.post("/chat/approve", response_model=ChatResponse)
def approve_action(data: ApprovalRequest):
    """
    Called when the user approves or rejects a pending action.
    If approved=True  → re-runs the supervisor with user_approved=True.
    If approved=False → returns a cancellation message.
    """

    if not data.approved:
        return ChatResponse(
            response="تم إلغاء العملية. لم يتم إجراء أي تغييرات.",
            thread_id=data.thread_id,
            agent_used="supervisor",
            pending_action=None,
        )

    try:
        result = run_supervisor(
            user_message=data.message,
            project_id=data.project_id,
            thread_id=data.thread_id,
            user_approved=True,
        )
    except ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama service is unavailable."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Engine error: {str(e)}"
        )

    return ChatResponse(
        response=result["response"],
        thread_id=data.thread_id,
        agent_used=result.get("agent_used", "task"),
        pending_action=None,
    )


# ─── GET / ─────────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {
        "status":  "running",
        "service": "Flowora AI Engine",
        "agents":  ["Task Manager", "User Manager"],
        "model":   "qwen3:8b via Ollama",
    }
