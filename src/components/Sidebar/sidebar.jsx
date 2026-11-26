import "./sidebar.css";
import { House, CheckSquare, Users, Settings, Folder, StarsIcon } from "lucide-react";
import { NavLink } from "react-router-dom"

export default function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-top">
                <h1>Flowora</h1>
                <img src="../src/assets/f-icon.png" alt="" />
            </div>
            <div className="sidebar-center">
                <NavLink className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} to="/layout/home"><House /> <span className="sidebar-tooltip">الرئيسية</span> </NavLink>
                <NavLink className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} to="/layout/projects"><Folder /><span className="sidebar-tooltip">المشاريع</span></NavLink>
                <NavLink className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} to="/layout/AI"><StarsIcon /><span className="sidebar-tooltip">Ai</span></NavLink>
                <NavLink className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} to="/layout/members"><Users /><span className="sidebar-tooltip">الاعضاء</span></NavLink>
            </div>
        </div>
    );
}