import "./projects.css";

import { useState, useEffect } from "react";

import { Folder } from "lucide-react";

import ProjectCard from "../../components/project-card/project-card"



export default function Projects() {


    const [showModal, setShowModal] = useState(false);
    const [projectname, setprojectname] = useState("");
    const [projectdescription, setprojectdescription] = useState("");
    const [projectdate, setprojectdate] = useState("");
    const [projectimg, setprojectimg] = useState(null);
    const [projects, setprojects] = useState([]);


    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [users, setUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);

    function toggleMember(userId) {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }

    async function addProject() {
        if (!projectname.trim()) {
            alert("اكتب اسم المشروع أولاً");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", projectname.trim());
            formData.append("description", projectdescription.trim());
            formData.append("end_date", projectdate || "");

            if (projectimg) {
                formData.append("img", projectimg);
            }

            const response = await fetch("http://localhost:3000/projects", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "فشل إنشاء المشروع");
            }

            await Promise.all(
                selectedMembers.map(async (userId) => {
                    const memberResponse = await fetch(
                        `http://localhost:3000/projects/${result.project.id}/members`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                user_id: userId
                            })
                        }
                    );

                    const memberResult = await memberResponse.json();

                    if (!memberResponse.ok) {
                        throw new Error(memberResult.message || "فشل إضافة أحد الأعضاء");
                    }
                })
            );

            const newProject = {
                ...result.project,
                members: selectedMembers.map(userId => ({
                    project_id: result.project.id,
                    user_id: userId,
                    user: users.find(user => user.id === userId) || null
                }))
            };

            setprojects(prevProjects => [
                newProject,
                ...prevProjects
            ]);
            setShowModal(false);
            setprojectname("");
            setprojectdescription("");
            setprojectdate("");
            setprojectimg(null);
            setSelectedMembers([]);

        } catch (error) {
            console.error("خطأ إنشاء المشروع:", error);
            alert(error.message || "حدث خطأ أثناء إنشاء المشروع");
        }
    }




    function deleteProject(projectId) {
        setSelectedProjectId(projectId);
        setShowDeleteModal(true);
    }

    async function confirmDeleteProject() {
        if (!selectedProjectId || isDeleting) return;

        setIsDeleting(true);

        try {
            const response = await fetch(
                `http://localhost:3000/projects/${selectedProjectId}`,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "فشل حذف المشروع");
            }

            setprojects(prev =>
                prev.filter(project => project.id !== selectedProjectId)
            );

            setShowDeleteModal(false);
            setSelectedProjectId(null);

        } catch (error) {
            console.error(error);
            alert(error.message);

        } finally {
            setIsDeleting(false);
        }
    }

    useEffect(() => {
        async function getProjects() {
            try {
                const response = await fetch("http://localhost:3000/projects");
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "فشل جلب المشاريع");
                }

                setprojects(result.projects);
            } catch (error) {
                console.error("خطأ جلب المشاريع:", error);
            }
        }

        getProjects();
    }, []);

    useEffect(() => {
        async function getUsers() {
            try {
                const response = await fetch("http://localhost:3000/users");
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message);
                }

                setUsers(Array.isArray(result) ? result : result.users || []);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        }

        getUsers();
    }, []);

    return (
        <section className="projects">

            {/* add-project-modal */}
            {showModal && (
                <div className="add-project-modal">
                    <button onClick={() => { setShowModal(false) }}>X</button>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0] || null; setprojectimg(file); }}
                    />
                    <input type="text" placeholder="اسم المشروع" value={projectname} onChange={(e) => setprojectname(e.target.value)} />
                    <input type="text" placeholder="وصف المشروع" value={projectdescription} onChange={(e) => setprojectdescription(e.target.value)} />
                    <input type="date" value={projectdate} onChange={(e) => setprojectdate(e.target.value)} />
                    <label>أعضاء المشروع</label>

                    {users.length > 0 ? users.map(user => (
                        <button
                            type="button"
                            key={user.id}
                            className={`project-member-option ${selectedMembers.includes(user.id) ? "selected" : ""
                                }`}
                            onClick={() => toggleMember(user.id)}
                            title={user.username}
                        >
                            <span className="member-avatar">
                                {user.username.trim().charAt(0).toUpperCase()}
                            </span>

                            <span className="member-name">
                                {user.username.trim()}
                            </span>
                        </button>
                    )) : <p>لا يوجد مستخدمون لعرضهم</p>}
                    <button onClick={addProject}>اضافة المشروع </button>
                </div>
            )}

            {/* projects head */}
            <div className="projects-head">
                <h1><Folder />المشاريع</h1>
                <button onClick={() => { setShowModal(true) }}>اضافة مشروع جديد </button>
            </div>



            {/* projects body */}

            <div className="projects-container">

                {projects.length > 0 ? (
                    projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onDelete={deleteProject}
                        />
                    ))
                ) : (
                    <p>لا توجد مشاريع حتى الآن</p>
                )}

            </div>

            {/* projects body */}
            <div className="projects-body">

            </div>


            {/* Delete Project Modal */}
            {showDeleteModal && (
                <div
                    className="delete-modal-overlay"
                    onClick={() => {
                        if (!isDeleting) setShowDeleteModal(false);
                    }}
                >
                    <div
                        className="delete-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="delete-modal-icon">
                            <Folder size={28} />
                        </div>

                        <h2>حذف المشروع؟</h2>

                        <p>
                            هل أنت متأكد أنك تريد حذف هذا المشروع؟
                            <br />
                            سيتم حذف المشروع وأعضائه وصورته نهائياً.
                        </p>

                        <div className="delete-modal-actions">

                            <button
                                className="cancel-delete-btn"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                إلغاء
                            </button>

                            <button
                                className="confirm-delete-btn"
                                onClick={confirmDeleteProject}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "جاري الحذف..." : "حذف المشروع"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </section>
    );
}