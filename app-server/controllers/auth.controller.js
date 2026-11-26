const authService = require("../services/auth.service");

async function login(req, res) {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "أدخل الإيميل أو اسم المستخدم وكلمة المرور"
            });
        }

        const user = await authService.login(
            identifier,
            password
        );

        if (!user) {
            return res.status(401).json({
                message: "بيانات تسجيل الدخول غير صحيحة"
            });
        }

        return res.status(200).json({
            message: "تم تسجيل الدخول بنجاح",
            user
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "حدث خطأ أثناء تسجيل الدخول"
        });
    }
}

async function register(req, res) {
    try {
        const { username, email, password, Job_Title } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "أدخل اسم المستخدم والبريد الإلكتروني وكلمة المرور"
            });
        }
        const avatar = req.file || null;

        const user = await authService.register(
            username,
            email,
            password,
            avatar,
            Job_Title
        );
        
        if (!user) {
            return res.status(400).json({
                message: "اسم المستخدم أو البريد الإلكتروني موجود بالفعل"
            });
        }

        return res.status(201).json({
            message: "تم إنشاء الحساب بنجاح",
            user
        });
    } catch (error) {
        console.error("Register error:", error.message);

        return res.status(500).json({
            message: "حدث خطأ أثناء إنشاء الحساب"
        });
    }
}
module.exports = {
    login,
    register
};
