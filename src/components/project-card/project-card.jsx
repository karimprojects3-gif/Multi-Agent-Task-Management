import { useNavigate } from "react-router-dom";

import "./project-card.css";

export default function ProjectCard({ project, onDelete }) {

    const navigate = useNavigate();

    return (
        <div className="project-card" onClick={() => navigate(`/layout/projects/${project.id}`)}>

            {/* project-head */}
            <div className="project-head">
                <div>
                    <h1>{project.name}</h1>
                    <p>{project.description}</p>
                </div>
                {project.img_url && (
                    <img
                        src={project.img_url}
                        alt={`صورة ${project.name}`}
                        className="project-image"
                    />
                )}
            </div>



            {/* project-body */}
            <div className="project-body">

                <div className="project-members">

                    {project.members?.slice(0, 4).map((member) => (
                        <div
                            className="project-member"
                            key={member.user_id}
                            title={member.user?.username || "مستخدم"}
                        >
                            <span className="member-avatar">
                                {member.user?.username?.trim().charAt(0).toUpperCase() || "?"}
                            </span>
                        </div>
                    ))}

                    {project.members?.length > 4 && (
                        <span className="members-more">
                            +{project.members.length - 4}
                        </span>
                    )}

                    {(!project.members || project.members.length === 0) && (
                        <span className="no-members">
                            لا يوجد أعضاء
                        </span>
                    )}

                </div>

            </div>



            {/* project-footer */}
            <div className="project-footer">
                <p className="project-date">
                    {project.end_date || "غير محدد"}
                </p>
                    <button
                        className="delete-project-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(project.id);
                        }}
                        title="حذف المشروع"
                    >
                        حذف
                    </button>
            </div>

        </div>
    );
}
