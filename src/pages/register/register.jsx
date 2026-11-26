import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";
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

const UserIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
            fill="currentColor"
            d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z"
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

export default function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    function handleAvatarChange(e) {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("يرجى اختيار ملف صورة");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("حجم الصورة يجب ألا يتجاوز 5MB");
            return;
        }

        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
        setError("");
    }


    async function handleRegister(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        const cleanUsername = username.trim();
        const cleanEmail = email.trim();

        if (!cleanUsername || !cleanEmail || !password || !confirmPassword || !jobTitle.trim()) {
            setError("يرجى تعبئة جميع الحقول");
            return;
        }

        if (password.length < 8) {
            setError("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل");
            return;
        }

        if (password !== confirmPassword) {
            setError("كلمتا المرور غير متطابقتين");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            formData.append("username", cleanUsername);
            formData.append("email", cleanEmail);
            formData.append("password", password);
            formData.append("Job_Title", jobTitle.trim());
            if (avatar) {
                formData.append("avatar", avatar);
            }

            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "تعذر إنشاء الحساب"
                );
            }

            setSuccess(data.message || "تم إنشاء الحساب بنجاح");

            // الانتقال إلى تسجيل الدخول بعد إظهار رسالة النجاح.
            // لا نحفظ كلمة المرور ولا نسجل الدخول تلقائياً.
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1200);
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

                    <h1>أنشئ حسابك</h1>
                    <p className="subtitle">
                        ابدأ رحلتك معنا اليوم
                    </p>

                    <form onSubmit={handleRegister}>
                        <div className="avatar-upload">
                            <label htmlFor="avatar-input" className="avatar-preview">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="معاينة صورة البروفايل" />
                                ) : (
                                    <UserIcon />
                                )}
                            </label>

                            <div className="avatar-info">
                                <label htmlFor="avatar-input">
                                    اختر صورة البروفايل
                                </label>

                                <span>PNG أو JPG — بحد أقصى 5MB</span>

                                <input
                                    type="file"
                                    id="avatar-input"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="اسم المستخدم"
                                aria-label="اسم المستخدم"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                minLength={3}
                                required
                            />
                            <span className="input-icon">
                                <UserIcon />
                            </span>
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                id="jobTitle"
                                name="Job_Title"
                                placeholder="المسمى الوظيفي"
                                aria-label="المسمى الوظيفي"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                required
                            />
                            <span className="input-icon">
                                <UserIcon />
                            </span>
                        </div>

                        <div className="input-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="البريد الإلكتروني"
                                aria-label="البريد الإلكتروني"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                required
                            />

                            <button
                                type="button"
                                className="input-icon input-icon--button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={
                                    showPassword
                                        ? "إخفاء كلمة المرور"
                                        : "إظهار كلمة المرور"
                                }
                            >
                                <EyeIcon off={showPassword} />
                            </button>
                        </div>

                        <div className="input-group">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="تأكيد كلمة المرور"
                                aria-label="تأكيد كلمة المرور"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                className="input-icon input-icon--button"
                                onClick={() =>
                                    setShowConfirmPassword((value) => !value)
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "إخفاء تأكيد كلمة المرور"
                                        : "إظهار تأكيد كلمة المرور"
                                }
                            >
                                <EyeIcon off={showConfirmPassword} />
                            </button>
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="login-message login-message--error"
                            >
                                {error}
                            </p>
                        )}

                        {success && (
                            <p
                                role="status"
                                className="login-message login-message--success"
                            >
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "جارٍ إنشاء الحساب..."
                                : "إنشاء حساب"}
                        </button>
                    </form>

                    <p className="subtitle">
                        لديك حساب بالفعل؟{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                        >
                            تسجيل الدخول
                        </button>
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