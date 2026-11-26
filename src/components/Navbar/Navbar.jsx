import "./Navbar.css";
import { BellDotIcon, SunMediumIcon } from "lucide-react";
import { useState } from "react";

export default function Navbar() {


    const [user, setUser] = useState(() => {
        const savedUser =
            localStorage.getItem("flowora_user") ||
            sessionStorage.getItem("flowora_user");

        return savedUser ? JSON.parse(savedUser) : null;
    });


    return (
        <>

            <div className="navbar">

                {/* left */}
                <div className="nav-search">
                    <input type="text" name="" id="" label="Search" placeholder="ابحث عن مشروع او مهمة" className="search-input" />
                </div>

                {/* right */}
                <div className="nav-right">

                    <div className="nav-button-container">
                        <button className="nav-button-number"><SunMediumIcon /></button>
                        <button><BellDotIcon /></button>
                    </div>

                    {/* user */}
                    <div className="user-container">
                        <div className="user-avatar">
                            <img src="../../../src/assets/user-avatar.png" alt="" style={{ width: "40px", height: "40px" }} />
                        </div>

                        <div className="user-info">
                            <p className="user-name">{user?.username}</p>
                            <p className="user-role">{user?.role}</p>
                        </div>

                    </div>
                </div>
            </div>

        </>
    );
}