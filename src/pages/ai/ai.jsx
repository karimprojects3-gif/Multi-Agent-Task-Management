import "./ai.css";
import {
    Sparkles,
    Send,
    WandSparkles,
    CheckCircle,
    XCircle,
    Bot,
    Users,
    Layers,
} from "lucide-react";

import { useEffect, useState, useRef } from "react";

// ─── Badge لكل Agent ────────────────────────────────────────────────────────
function AgentBadge({ agent }) {
    if (agent === "user")
        return (
            <span className="agent-badge agent-badge-user">
                <Users size={11} /> User Agent
            </span>
        );
    if (agent === "both")
        return (
            <span className="agent-badge agent-badge-both">
                <Layers size={11} /> Multi-Agent
            </span>
        );
    return (
        <span className="agent-badge agent-badge-task">
            <Bot size={11} /> Task Agent
        </span>
    );
}


// ─── بطاقة الموافقة البشرية ─────────────────────────────────────────────────
function ApprovalCard({ pending, threadId, projectId, onApprove, onReject }) {
    return (
        <div className="approval-card">
            <p className="approval-title">⚠️ هذه العملية تعدّل بيانات المشروع. هل تريد المتابعة؟</p>
            <p className="approval-action">{pending.request}</p>
            <div className="approval-actions">
                <button className="approval-btn approve" onClick={onApprove}>
                    <CheckCircle size={15} /> تأكيد
                </button>
                <button className="approval-btn reject" onClick={onReject}>
                    <XCircle size={15} /> إلغاء
                </button>
            </div>
        </div>
    );
}


export default function Ai() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // thread_id لذاكرة المحادثة
    const [threadId, setThreadId] = useState(() => crypto.randomUUID());

    // للموافقة البشرية
    const [pendingAction, setPendingAction] = useState(null);
    const [pendingMessage, setPendingMessage] = useState("");

    const messagesEndRef = useRef(null);
    const isChatStarted = messages.length > 0;


    // التمرير التلقائي
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }, [messages, loading, pendingAction]);


    // جلب المشاريع
    useEffect(() => {
        async function fetchProjects() {
            try {
                const response = await fetch("http://localhost:3000/projects");
                if (!response.ok) throw new Error("Failed to fetch projects");
                const data = await response.json();
                const list = Array.isArray(data) ? data : data.projects || [];
                setProjects(list);
                if (list.length > 0) setProjectId(String(list[0].id));
            } catch (err) {
                console.error("Projects error:", err);
            }
        }
        fetchProjects();
    }, []);


    // ─── إرسال رسالة ────────────────────────────────────────────────────────
    async function sendMessage() {
        if (!message.trim() || loading) return;

        const userText = message.trim();

        setMessages(prev => [...prev, { role: "user", content: userText }]);
        setMessage("");
        setLoading(true);
        setPendingAction(null);

        try {
            const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message:    userText,
                    project_id: Number(projectId) || 1,
                    thread_id:  threadId,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي");
            }

            // تحديث thread_id إذا رجع جديد
            if (data.thread_id) setThreadId(data.thread_id);

            // هل يحتاج موافقة؟
            if (data.pending_action) {
                setPendingAction(data.pending_action);
                setPendingMessage(userText);
                setMessages(prev => [
                    ...prev,
                    {
                        role:    "assistant",
                        content: data.response || "هذا الإجراء يحتاج لموافقتك.",
                        agent:   data.agent_used,
                    }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role:    "assistant",
                        content: data.response,
                        agent:   data.agent_used,
                    }
                ]);
            }

        } catch (err) {
            const isOffline = err.message === "Failed to fetch";
            setMessages(prev => [
                ...prev,
                {
                    role:    "assistant",
                    content: isOffline
                        ? "⚠️ لا يمكن الوصول إلى خادم الذكاء الاصطناعي.\nتأكد من تشغيل:\n• uvicorn main:app --reload --port 8000\n• ollama serve"
                        : `حدث خطأ: ${err.message}`,
                    agent:   "task",
                }
            ]);
        } finally {
            setLoading(false);
        }
    }


    // ─── الموافقة على إجراء ─────────────────────────────────────────────────
    async function handleApprove(approved) {
        setPendingAction(null);
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/chat/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    thread_id:  threadId,
                    project_id: Number(projectId) || 1,
                    message:    pendingMessage,
                    approved,
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || "خطأ في السيرفر");

            setMessages(prev => [
                ...prev,
                {
                    role:    "assistant",
                    content: data.response,
                    agent:   data.agent_used,
                }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role:    "assistant",
                    content: `حدث خطأ: ${err.message}`,
                    agent:   "task",
                }
            ]);
        } finally {
            setLoading(false);
            setPendingMessage("");
        }
    }


    // ─── محادثة جديدة ───────────────────────────────────────────────────────
    function newChat() {
        if (loading) return;
        setMessages([]);
        setMessage("");
        setPendingAction(null);
        setPendingMessage("");
        setThreadId(crypto.randomUUID());
    }


    return (
        <section className="ai-page">

            {/*─── الجانب الأيمن ───────────────────────────────*/}
            <div className="right-side">
                <button
                    className="ai-new-chat"
                    onClick={newChat}
                    disabled={loading}
                >
                    <Sparkles size={16} />
                    محادثة جديدة
                </button>

                {/* اختيار المشروع */}
                {projects.length > 0 && (
                    <div className="ai-project-select">
                        <select
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            disabled={loading}
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>


            {/*─── الحاوية الرئيسية ─────────────────────────────*/}
            <div className={`ai-container 
                ${loading ? "ai-is-thinking" : ""}
                ${isChatStarted ? "ai-chat-started" : ""}
            `}>

                {/* الخلفية */}
                <div className="ai-background">
                    <div className="ai-bg-base" />
                    <div className="ai-bg-glow ai-bg-glow-1" />
                    <div className="ai-bg-glow ai-bg-glow-2" />
                    <div className="ai-bg-glow ai-bg-glow-3" />
                    <div className="ai-bg-beam ai-bg-beam-1" />
                    <div className="ai-bg-beam ai-bg-beam-2" />
                    <div className="ai-bg-particles">
                        {Array.from({ length: 12 }, (_, i) => (
                            <span key={i} />
                        ))}
                    </div>
                    <div className="ai-bg-vignette" />
                </div>


                {/* ترحيب */}
                <div className={`AI-head-container ${isChatStarted ? "welcome-hidden" : ""}`}>
                    <div className="ai-scene">
                        <div className="ai-back-glow" />
                        <div className="ai-light-beam" />
                        <div className="ai-halo" />
                        <div className="ai-jelly">
                            <div className="ai-jelly-shine" />
                            <div className="ai-jelly-reflection" />
                            <svg className="ai-star" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="aiStarGradient" x1="20" y1="15" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#FFFFFF" />
                                        <stop offset="45%" stopColor="#C4B5FD" />
                                        <stop offset="100%" stopColor="#60A5FA" />
                                    </linearGradient>
                                </defs>
                                <path d="M50 5 C57 30 68 42 95 50 C68 58 57 70 50 95 C43 70 32 58 5 50 C32 42 43 30 50 5Z" fill="url(#aiStarGradient)" />
                                <path d="M50 18 C56 38 62 44 82 50 C62 56 56 62 50 82 C44 62 38 56 18 50 C38 44 44 38 50 18Z" fill="white" opacity="0.35" />
                            </svg>
                        </div>
                    </div>

                    <div className="ai-heading">
                        <div className="ai-badge">
                            <Sparkles size={15} />
                            <span>Multi-Agent AI</span>
                        </div>
                        <h1>مرحباً بك في <span>Flowora AI</span></h1>
                        <p>
                            مساعدك الذكي متعدد الوكلاء لإدارة المهام والفريق،
                            يوجّه سؤالك تلقائياً إلى الوكيل المناسب.
                        </p>
                    </div>
                </div>


                {/* رسائل المحادثة */}
                <div className={`AI-body-container ${isChatStarted ? "chat-active" : ""}`}>

                    {messages.map((msg, index) => (
                        <div key={index} className={`ai-message ${msg.role}`}>
                            <div className="ai-message-content">
                                {msg.role === "assistant" && msg.agent && (
                                    <AgentBadge agent={msg.agent} />
                                )}
                                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                            </div>
                        </div>
                    ))}


                    {/* بطاقة الموافقة */}
                    {pendingAction && !loading && (
                        <div className="ai-message assistant">
                            <div className="ai-message-content">
                                <ApprovalCard
                                    pending={pendingAction}
                                    threadId={threadId}
                                    projectId={projectId}
                                    onApprove={() => handleApprove(true)}
                                    onReject={() => handleApprove(false)}
                                />
                            </div>
                        </div>
                    )}


                    {/* Thinking Animation */}
                    {loading && (
                        <div className="ai-message assistant">
                            <div className="ai-thinking">
                                <div className="thinking-orb">
                                    <div className="thinking-orb-glow" />
                                    <Sparkles size={21} className="thinking-star" />
                                    <span className="orbit-star star-one">✦</span>
                                    <span className="orbit-star star-two">✧</span>
                                    <span className="orbit-star star-three">✦</span>
                                </div>
                                <div className="thinking-text">
                                    <span>Flowora AI</span>
                                    <p>جاري تحليل طلبك...</p>
                                </div>
                                <div className="thinking-dots">
                                    <span /><span /><span />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>


                {/* Footer / Input */}
                <div className="ai-container-footer">
                    <div className="ai-input-container">
                        <input
                            type="text"
                            placeholder="اسأل عن المهام أو الفريق..."
                            className="ai-input"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") sendMessage();
                            }}
                            disabled={loading}
                        />
                        <button
                            className="ai-send-button"
                            onClick={sendMessage}
                            disabled={loading || !message.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>

            </div>

        </section>
    );
}
