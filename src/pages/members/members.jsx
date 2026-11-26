import "./members.css";
import { useState, useEffect } from "react";

export default function Members() {

    const [members, setmembers] = useState([]);

    useEffect(() => {

        async function getmembers() {
            const response = await fetch("http://localhost:3000/users");
            const users = await response.json();

            setmembers(users);

        }
        getmembers();
    }, [])

    return (
        <section className="Members-page">
            {/* user-details */}
            {/* <div className="user-details">
                <img src="../../../src/assets/user-avatar.png" alt="" />
                <h1>احمد خالد</h1>
                <p>مصمم</p>
                <div>

                </div>
            </div> */}

            {/* members */}
            <div className="content">
                <div className="members-head">
                    <h1>اعضاء الفريق</h1>
                    <p>12عضواً</p>
                </div>


                <div className="members">

                    {members.map((member) => (

                        <div className="members-card" key={member.id}>

                            <div className="members-card-right-s">
                                <h1>{member.username}</h1>
                                <p>{member.Job_Title}</p>
                            </div>

                            <img
                                src={member.avatar || "/user-avatar.png"}
                                alt={member.username}
                            />

                        </div>

                    ))}





                </div>

            </div>

        </section>
    )
}