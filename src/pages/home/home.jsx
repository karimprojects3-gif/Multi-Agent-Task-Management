import "./home.css";
import { Zap, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
export default function home() {

    const [date, setDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthName = currentDate.toLocaleDateString("ar-SA", {
        month: "long",
        year: "numeric"
    });

    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    const calendarDays = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    const changeMonth = (amount) => {
        setCurrentDate(new Date(year, month + amount, 1));
    };

    const [user, setUser] = useState(() => {
        const savedUser =
            localStorage.getItem("flowora_user") ||
            sessionStorage.getItem("flowora_user");

        return savedUser ? JSON.parse(savedUser) : null;
    });
    return (

        <div className="home">

            {/* right */}
            <div className="right-side">

                {/* <div className="last-active-container">
                    <h1><Zap className="zap-icon" />الأنشطة الأخيرة</h1>
                    <div className="last-active-card">
                        <img src="../../../src/assets/user-avatar.png" alt="" style={{ width: "40px", height: "40px" }} />
                        <div className="last-active-card-text">
                            <h1>احمد خالد</h1>
                            <h1>اكمل تصميم الواجهة</h1>
                            <p>منذ 10 دقائق</p>
                        </div>
                    </div>
                    <div className="last-active-card">
                        <img src="../../../src/assets/user-avatar.png" alt="" style={{ width: "40px", height: "40px" }} />
                        <div className="last-active-card-text">
                            <h1>احمد خالد</h1>
                            <h1>اكمل تصميم الواجهة</h1>
                            <p>منذ 10 دقائق</p>
                        </div>
                    </div>
                    <div className="last-active-card">
                        <img src="../../../src/assets/user-avatar.png" alt="" style={{ width: "40px", height: "40px" }} />
                        <div className="last-active-card-text">
                            <h1>احمد خالد</h1>
                            <h1>اكمل تصميم الواجهة</h1>
                            <p>منذ 10 دقائق</p>
                        </div>
                    </div>
                </div> */}

                <div className="calendar-container">

                    <div className="calendar-header">
                        <h1><Calendar className="zap-icon" /> التقويم</h1>

                        <div className="calendar-controls">
                            <button onClick={() => changeMonth(-1)}>
                                <ChevronRight />
                            </button>

                            <span>{monthName}</span>

                            <button onClick={() => changeMonth(1)}>
                                <ChevronLeft />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid">

                        {days.map((day) => (
                            <div className="calendar-weekday" key={day}>
                                {day}
                            </div>
                        ))}

                        {calendarDays.map((day, index) => {
                            const isToday =
                                day === new Date().getDate() &&
                                month === new Date().getMonth() &&
                                year === new Date().getFullYear();

                            const isSelected =
                                day === selectedDate.getDate() &&
                                month === selectedDate.getMonth() &&
                                year === selectedDate.getFullYear();

                            return (
                                <button
                                    key={index}
                                    className={`calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                                    disabled={!day}
                                    onClick={() => setSelectedDate(new Date(year, month, day))}
                                >
                                    {day}
                                </button>
                            );
                        })}

                    </div>

                    <div className="calendar-selected-date">
                        التاريخ المحدد:
                        <span>
                            {selectedDate.toLocaleDateString("ar-SA", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </span>
                    </div>

                </div>

            </div>

            {/* left */}
            <div className="left-side-home">

                {/* welcome */}
                <div className="welcome-container">
                    <img src="../../../src/assets/home.png" alt="" />

                    {/* التأثيرات الضوئية */}
                    <div className="welcome-effects" aria-hidden="true">
                        <span className="welcome-halo"></span>
                        <span className="welcome-orbit"></span>
                        <span className="welcome-shine"></span>
                        <span className="welcome-spark welcome-spark-1"></span>
                        <span className="welcome-spark welcome-spark-2"></span>
                        <span className="welcome-spark welcome-spark-3"></span>
                    </div>

                    <div className="welcome-message">
                        <h1>مرحبا{user?.username}</h1>
                        <p>جاهز ليوم جديد من الإنتاجية؟</p>
                    </div>
                </div>


                {/* summarize */}

                {/* 3 */}

            </div>

            <div className="bc-red">

            </div>
        </div>

    );
}
