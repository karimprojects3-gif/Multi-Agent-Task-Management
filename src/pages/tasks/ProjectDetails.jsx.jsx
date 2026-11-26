import "./ProjectDetails.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ListTodo, ClockFadingIcon, UserPenIcon, CheckCircle2, MessageCircleCode, PaperclipIcon, X, MoreVertical } from "lucide-react";

export default function ProjectDetails() {

    const { id } = useParams();

    // task-modal
    const [showModal, setshowModal] = useState(false);
    const [title, settitle] = useState("");
    const [description, setdescription] = useState("");
    const [state, setstate] = useState("");
    const [Priority, setPriority] = useState("");
    const [date_end, setdate_end] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [tasks, settasks] = useState([]);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");

    const [currentUser] = useState(() => {
        const savedUser =
            localStorage.getItem("flowora_user") ||
            sessionStorage.getItem("flowora_user");

        return savedUser ? JSON.parse(savedUser) : null;
    });
    // selectedTask-task-modal
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const selectedTask = tasks.find(task => task.id === selectedTaskId);

    const [selectedMembers, setSelectedMembers] = useState([]);
    const [projectMembers, setProjectMembers] = useState([]);
    const [taskMembers, setTaskMembers] = useState([]);
    function toggleMember(userId) {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }
    const todoTasks = tasks.filter(task => task.state === "to-do");

    const progressTasks = tasks.filter(task => task.state === "in-progress");

    const reviewtasks = tasks.filter(task => task.state === "in-review");

    const completedTasks = tasks.filter(task => task.state === "complete");

    const openAttachment = async (file) => {
        const response = await fetch(
            `http://localhost:3000/tasks/attachment/${selectedTask.id}/${encodeURIComponent(file.file_name)}`
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        window.open(data.url, "_blank");
    };
    async function addtask() {

        if (!title.trim()) {
            alert("ادخل العنوان");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("member_ids", JSON.stringify(selectedMembers));
            formData.append("title", title.trim());
            formData.append("description", description.trim());
            formData.append("state", state.trim());
            formData.append("Priority", Priority.trim());
            formData.append("date_end", date_end.trim());
            formData.append("project_id", id);
            attachments.forEach((file) => {
                formData.append("attachments", file);
            });
            const response = await fetch("http://localhost:3000/tasks", {
                method: "post",
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "فشل إنشاء المهمة");
            }

            settasks((prevTasks) => [
                result.tasks,
                ...prevTasks
            ]);
            setshowModal(false);
            settitle("");
            setdescription("");
            setstate("");
            setPriority("");
            setdate_end("");
            setAttachments([]);
            setSelectedMembers([]);
        } catch (error) {
            alert(error.message || "حدث خطأ أثناء إنشاء المهمة");
        }

    }
    async function getProjectMembers() {
        try {
            const response = await fetch(
                `http://localhost:3000/projects/${id}/members`
            );

            const result = await response.json();

            console.log("Project Members API:", result);

            if (!response.ok) {
                throw new Error(result.message);
            }

            setProjectMembers(result.members || []);

        } catch (error) {
            console.error("Error fetching project members:", error);
        }
    }

    async function getTaskComments(taskId) {
        try {
            const response = await fetch(
                `http://localhost:3000/tasks/${taskId}/comments`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setComments(result.comments || []);

        } catch (error) {
            console.error("Error fetching comments:", error);
            setComments([]);
        }
    }

    async function addComment() {
        if (!commentText.trim()) return;

        if (!currentUser?.id) {
            alert("تعذر تحديد المستخدم");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/tasks/${selectedTaskId}/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: currentUser.id,
                        content: commentText.trim()
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setComments(prev => [...prev, result.comment]);
            setCommentText("");

        } catch (error) {
            console.error("Add comment error:", error);
            alert(error.message);
        }
    }
    async function getTaskMembers(taskId) {
        try {
            const response = await fetch(
                `http://localhost:3000/tasks/${taskId}/members`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setTaskMembers(result.members || []);

        } catch (error) {
            console.error("Error fetching task members:", error);
            setTaskMembers([]);
        }
    }
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, newState) => {
        e.preventDefault();

        const taskId = Number(e.dataTransfer.getData("taskId"));

        const oldTasks = [...tasks];

        // تحديث الواجهة مباشرة
        settasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? { ...task, state: newState }
                    : task
            )
        );

        try {
            const response = await fetch(`http://localhost:3000/tasks/${taskId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    state: newState
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            // اعتماد البيانات التي رجعت من السيرفر
            settasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? result.task : task
                )
            );

        } catch (error) {
            console.error("Error updating task:", error);

            // إرجاع البيانات القديمة إذا فشل التحديث
            settasks(oldTasks);
        }
    };

    useEffect(() => {
        async function getTasks() {
            try {
                const response = await fetch(`http://localhost:3000/tasks/${id}`);


                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message)
                }

                settasks(result.tasks);
            } catch (error) {
                console.log(error.message);

            }
        }
        getTasks();

    }, [id]);

    useEffect(() => {
        if (selectedTaskId) {
            getTaskComments(selectedTaskId);
            setCommentText("");
        } else {
            setComments([]);
        }
    }, [selectedTaskId]);


    useEffect(() => {
        getProjectMembers();
    }, [id]);
    return (
        <div className="tasks-page">

            {/* modals */}
            {/* add-task-modal */}
            {showModal && (
                <div className="add-task-modal">
                    <button onClick={() => { setshowModal(false) }}>X</button>

                    <label>العنوان</label>
                    <input type="text" placeholder="مثال: تصميم واجهة المشروع" onChange={(e) => settitle(e.target.value)} value={title} />

                    <label>الوصف</label>
                    <input type="text" placeholder="وصف المهمة" onChange={(e) => setdescription(e.target.value)} value={description} />


                    <label>الحالة</label>
                    <select onChange={(e) => setstate(e.target.value)} value={state}>
                        <option value="">اختر</option>
                        <option value="to-do">to-do</option>
                        <option value="in-progress">in-progress</option>
                        <option value="in-Review">in-Review</option>
                        <option value="complete">complete</option>
                    </select>

                    <label>الاولوية</label>
                    <select onChange={(e) => setPriority(e.target.value)} value={Priority}>
                        <option value="">اختر</option>
                        <option value="high">عاجل</option>
                        <option value="medium">متوسط</option>
                        <option value="low">منخفض</option>
                    </select>

                    <label>تاريخ الانتهاء</label>
                    <input type="date" onChange={(e) => setdate_end(e.target.value)} value={date_end} />
                    <label>أعضاء المهمة</label>

                    <div className="task-members-select">

                        {projectMembers.length > 0 ? (
                            projectMembers.map(member => {

                                const user = member.user || member;
                                const userId = member.user_id ?? user.id;

                                return (
                                    <button
                                        type="button"
                                        key={userId}
                                        className={`task-member-option ${selectedMembers.includes(userId) ? "selected" : ""
                                            }`}
                                        onClick={() => toggleMember(userId)}
                                        title={user.username}
                                    >
                                        <span className="member-avatar">
                                            {user.username.trim().charAt(0).toUpperCase()}
                                        </span>

                                        <span className="member-name">
                                            {user.username.trim()}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <p>لا يوجد أعضاء في هذا المشروع</p>
                        )}

                    </div>
                    <label>المرفقات</label>

                    <input
                        type="file"
                        multiple
                        onChange={(e) => setAttachments(Array.from(e.target.files))}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    />

                    {attachments.map((file, index) => (
                        <p key={index}>{file.name}</p>
                    ))}
                    <button onClick={() => { console.log("clicked"); addtask(); }}> اضافة مهمة</button>
                </div>
            )}

            {/*tasks-details-modal*/}

            {selectedTask && (
                <div className="tasks-details-modal">

                    {/*t-detailsd-header */}
                    <div className="t-detailsd-header">
                        <div className="t-detailsd-header-right">
                            <button onClick={() => setSelectedTaskId(null)}><X /></button>
                            <button><MoreVertical /></button>
                        </div>
                        <div className="t-detailsd-header-left">
                            <h1>{selectedTask.title}</h1>
                            <p>{selectedTask.Priority}</p>
                        </div>
                    </div>

                    {/*t-detailsd-body*/}
                    <div className="t-detailsd-body">
                        {/* left-side */}
                        <div className="left-side">
                            <div className="left-side-top">

                                {comments.map(comment => (
                                    <div className="comment-m-div" key={comment.id}>

                                        <div className="comment-m">
                                            <p>{comment.users?.username || "مستخدم"}</p>

                                            <h4>{comment.content}</h4>

                                            <span>
                                                {new Date(comment.created_at).toLocaleString("ar-SA")}
                                            </span>
                                        </div>

                                        <img src="../../../src/assets/user-avatar.png" alt="" />

                                    </div>
                                ))}

                                {comments.length === 0 && (
                                    <p>لا توجد تعليقات حتى الآن</p>
                                )}
                            </div>

                            <div className="left-side-bottom">
                                <button onClick={addComment}>ارسال</button>

                                <input
                                    type="text"
                                    placeholder="اكتب تعليق"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addComment();
                                    }}
                                />
                            </div>
                        </div>
                        {/* right-side */}
                        <div className="right-side">

                            <div className="right-side-header">
                                <p>Assigned to</p>
                                <p>Tracked time</p>
                                <p>Deadline</p>
                                <p>Status</p>

                                <div className="assigned-members-list">
                                    {taskMembers.length > 0 ? (
                                        taskMembers.map(member => (
                                            <div className="assigned-member" key={member.id}>
                                                <span className="member-avatar">
                                                    {member.username.charAt(0).toUpperCase()}
                                                </span>

                                                <span>{member.username}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <h5>لا يوجد أعضاء</h5>
                                    )}
                                </div>
                                <h5>
                                    {new Date(selectedTask.created_at).toLocaleDateString("en-SA", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })}
                                </h5>
                                <h5>{selectedTask.date_end}</h5>
                                <h5>{selectedTask.state}</h5>
                            </div>


                            <div className="right-side-body">
                                <h3>Description</h3>
                                <p>{selectedTask.description}</p>
                            </div>


                            <div className="right-side-footer">

                                <h3>Attachments</h3>

                                <div className="attachments-list">
                                    {selectedTask.attachments?.length > 0 ? (
                                        selectedTask.attachments.map((file, index) => (
                                            <div className="attachment-card" key={index}>

                                                <div className="attachment-icon">
                                                    <PaperclipIcon />
                                                </div>

                                                <div className="attachment-info">
                                                    <p className="attachment-name">{file.file_name}</p>
                                                    <span>
                                                        {(file.file_size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>

                                                <button
                                                    className="attachment-open"
                                                    onClick={() => openAttachment(file)}
                                                >
                                                    فتح
                                                </button>

                                            </div>
                                        ))
                                    ) : (
                                        <p>لا توجد مرفقات</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            )}

            {/* tasks-board */}
            <div className="tasks-summary-container">

                {/*  */}
                <div className="tasks-summary-card">
                    <h1>{tasks.length}</h1>
                    <p>المهام</p>
                </div>

                {/*  */}
                <div className="tasks-summary-card">
                    <h1>{completedTasks.length}</h1>
                    <p>المهام المكتملة</p>
                </div>

                {/*  */}
                <div className="tasks-summary-card">
                    <h1>12 </h1>
                    <p>المهام المكتملة</p>
                </div>

                {/*  */}
                <div className="tasks-summary-card">
                    <h1>12 </h1>
                    <p>المهام المكتملة</p>
                </div>





            </div>
            {/* tasks-board */}
            <div className="tasks-board">
                <div className="tasks-board-top">
                    <button onClick={() => { setshowModal(true) }}>اضافة مهمة جديدة</button>
                    <button>filter</button>
                    <input type="text" placeholder="ابحث عن مهمة" />
                </div>


                <div className="tasks-board-body">

                    {/* complete */}
                    <div className="complete" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "complete")}>
                        <h1>Complete <CheckCircle2 /></h1>

                        {/* completedTasks-card */}
                        {completedTasks.map(tasks => (

                            <div className="task-card" key={tasks.id} draggable={true} onDragStart={(e) => { handleDragStart(e, tasks.id) }} onClick={() => {
                                setSelectedTaskId(tasks.id);
                                getTaskMembers(tasks.id);
                            }} >
                                <div className="task-card-top">
                                    <img src="../../../src/assets/user-avatar.png" alt="" />
                                    <h1>{tasks.title}</h1>
                                    <p>{tasks.description}</p>
                                </div>

                                <div className="task-card-body" >
                                    <p className="task-date">{tasks.date_end}</p>
                                    <p className="Priority">{tasks.Priority}</p>
                                </div>

                                <div className="task-card-footer">
                                    <div>
                                        <p>12<MessageCircleCode /></p>
                                        <p>7<PaperclipIcon /></p>
                                    </div>
                                    <div>
                                        <img className="meb1" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb2" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb3" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb4" src="../../../src/assets/user-avatar.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>


                    {/* In-Review  */}
                    <div className="In-Review" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "in-review")}>
                        <h1>In Review <UserPenIcon /></h1>

                        {/* reviewtasks-card */}
                        {reviewtasks.map(tasks => (

                            <div className="task-card" key={tasks.id} draggable={true} onDragStart={(e) => { handleDragStart(e, tasks.id) }} onClick={() => {
                                setSelectedTaskId(tasks.id);
                                getTaskMembers(tasks.id);
                            }}>
                                <div className="task-card-top">
                                    <img src="../../../src/assets/user-avatar.png" alt="" />
                                    <h1>{tasks.title}</h1>
                                    <p>{tasks.description}</p>
                                </div>

                                <div className="task-card-body" >
                                    <p className="task-date">{tasks.date_end}</p>
                                    <p className="Priority">{tasks.Priority}</p>
                                </div>

                                <div className="task-card-footer">
                                    <div>
                                        <p>12<MessageCircleCode /></p>
                                        <p>7<PaperclipIcon /></p>
                                    </div>
                                    <div>
                                        <img className="meb1" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb2" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb3" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb4" src="../../../src/assets/user-avatar.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* in-progress */}
                    <div className="in-progress" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "in-progress")}>

                        <h1>in Progress <ClockFadingIcon /></h1>

                        {/* progressTasks-card */}
                        {progressTasks.map(tasks => (

                            <div className="task-card" key={tasks.id} draggable={true} onDragStart={(e) => { handleDragStart(e, tasks.id) }} onClick={() => {
                                setSelectedTaskId(tasks.id);
                                getTaskMembers(tasks.id);
                            }}>
                                <div className="task-card-top">
                                    <img src="../../../src/assets/user-avatar.png" alt="" />
                                    <h1>{tasks.title}</h1>
                                    <p>{tasks.description}</p>
                                </div>

                                <div className="task-card-body" >
                                    <p className="task-date">{tasks.date_end}</p>
                                    <p className="Priority">{tasks.Priority}</p>
                                </div>

                                <div className="task-card-footer">
                                    <div>
                                        <p>12<MessageCircleCode /></p>
                                        <p>7<PaperclipIcon /></p>
                                    </div>
                                    <div>
                                        <img className="meb1" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb2" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb3" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb4" src="../../../src/assets/user-avatar.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* to-do  */}
                    <div className="to-do" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "to-do")}>
                        <h1>To Do <ListTodo /></h1>

                        {/* todoTasks-card */}
                        {todoTasks.map(tasks => (

                            <div className="task-card" key={tasks.id} draggable onDragStart={(e) => handleDragStart(e, tasks.id)} onClick={() => {
                                setSelectedTaskId(tasks.id);
                                getTaskMembers(tasks.id);
                            }} >
                                <div className="task-card-top">
                                    <img src="../../../src/assets/user-avatar.png" alt="" />
                                    <h1>{tasks.title}</h1>
                                    <p>{tasks.description}</p>
                                </div>

                                <div className="task-card-body" >
                                    <p className="task-date">{tasks.date_end}</p>
                                    <p className="Priority">{tasks.Priority}</p>
                                </div>

                                <div className="task-card-footer">
                                    <div>
                                        <p>12<MessageCircleCode /></p>
                                        <p>7<PaperclipIcon /></p>
                                    </div>
                                    <div>
                                        <img className="meb1" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb2" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb3" src="../../../src/assets/user-avatar.png" alt="" />
                                        <img className="meb4" src="../../../src/assets/user-avatar.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>


                </div>

            </div>

        </div >
    );
}