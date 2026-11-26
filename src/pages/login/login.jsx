
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import ficon from "../../assets/f-icon.png";

const API_URL = "http://localhost:3000";

const MailIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
            fill="currentColor"
            d="M3 5h18a1 1 0 0 1 1 1v.4l-10 6.6L2 6.4V6a1 1 0 0 1 1-1Zm-1 3.8 9.45 6.2a1 1 0 0 0 1.1 0L22 8.8V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.8Z"
        />
    </svg>
);

const EyeIcon = ({ off }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
            fill="currentColor"
            d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7Zm0 3.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
        />
        {off && (
            <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        )}
    </svg>
);

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
            fill="#000"
            d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
    </svg>
);

const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
            fill="#1877F2"
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
    </svg>
);

export default function Login() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();

        setError("");

        if (!identifier.trim() || !password) {
            setError("أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "تعذر تسجيل الدخول، تحقق من بياناتك"
                );
            }

            if (!data.user) {
                throw new Error("بيانات المستخدم غير موجودة");
            }

            // حفظ بيانات المستخدم فقط، وليس كلمة المرور.
            const storage = remember ? localStorage : sessionStorage;

            // إزالة بيانات جلسة الواجهة القديمة من التخزينين.
            localStorage.removeItem("flowora_user");
            sessionStorage.removeItem("flowora_user");

            storage.setItem("flowora_user", JSON.stringify(data.user));

            // الانتقال إلى الصفحة الرئيسية بعد نجاح تسجيل الدخول.
            navigate("/layout", { replace: true });
        } catch (err) {
            setError(
                err instanceof TypeError
                    ? "تعذر الاتصال بالسيرفر. تأكد أنه يعمل على المنفذ 3000."
                    : err.message || "حدث خطأ غير متوقع"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        
        <main className="login-page">
            <section className="login-side">
                <div className="login-container">
                    <img src={ficon} id="f-icon" alt="Flowora" />
                    <h1 className="kareem">مرحباً بعودتك</h1>
                    <p className="subtitle">
                        سجّل دخولك للمتابعة إلى مساحة عملك
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <input
                                type="text"
                                id="identifier"
                                name="identifier"
                                placeholder="البريد الإلكتروني أو اسم المستخدم"
                                aria-label="البريد الإلكتروني أو اسم المستخدم"
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                            <span className="input-icon">
                                <MailIcon />
                            </span>
                        </div>

                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="كلمة المرور"
                                aria-label="كلمة المرور"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="input-icon input-icon--button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={
                                    showPassword
                                        ? "إخفاء كلمة المرور"
                                        : "إظهار كلمة المرور"
                                }
                            >
                                <EyeIcon off={showPassword} />
                            </button>
                        </div>

                        <div className="options">


                            <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                            >
                                نسيت كلمة المرور؟
                            </a>
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="login-message login-message--error"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "جارٍ تسجيل الدخول..."
                                : "تسجيل الدخول"}
                        </button>
                    </form>

                    <div className="divider">
                        <span>أو</span>
                    </div>

                    <div className="socials">
                        <button
                            type="button"
                            className="social-btn"
                            aria-label="المتابعة عبر Apple"
                        >
                            <AppleIcon />
                        </button>

                        <button
                            type="button"
                            className="social-btn"
                            aria-label="المتابعة عبر Google"
                        >
                            <GoogleIcon />
                        </button>

                        <button
                            type="button"
                            className="social-btn"
                            aria-label="المتابعة عبر Facebook"
                        >
                            <FacebookIcon />
                        </button>
                    </div>

                    <p className="signup">
                        ليس لديك حساب؟{" "}
                        <a
                            href="/register"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate("/register");
                            }}
                        >
                            إنشاء حساب جديد
                        </a>
                    </p>
                </div>
            </section>

            <aside className="login-art" aria-hidden="true">
                <span className="art-shape art-shape--one" />
                <span className="art-shape art-shape--two" />
            </aside>
        </main>
    );
}
