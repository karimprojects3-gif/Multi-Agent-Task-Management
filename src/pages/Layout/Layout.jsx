import { Outlet,} from "react-router-dom";
import "./Layout.css";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/sidebar";

export default function Layout() {
    return (
        <div className="layout">
            {/* header  */}
            <header className="layout-navbar">
                <Navbar />
            </header>

            {/* sidebar  */}
            <aside className="layout-sidebar">
                <Sidebar />
            </aside>

            {/* content  */}
            <main className="layout-content">
                <Outlet />
            </main>

        </div>
    );
}