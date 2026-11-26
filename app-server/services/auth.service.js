const supabase = require("../supabase");

async function login(identifier, password) {
    const value = identifier.trim();

    let { data: user, error } = await supabase
        .from("users")
        .select("id, username, email, password, role")
        .eq("email", value)
        .maybeSingle();

    if (error) throw error;

    if (!user) {
        const result = await supabase
            .from("users")
            .select("id, username, email, password, role")
            .eq("username", value)
            .maybeSingle();

        if (result.error) throw result.error;
        user = result.data;
    }

    if (!user || typeof user.password !== "string") {
        return null;
    }

    // هذا تحقق مؤقت للحسابات القديمة ذات كلمات المرور النصية.
    // لا تستخدمه كنظام مصادقة نهائي في الإنتاج.
    if (user.password !== password) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
}

async function register(username, email, password, avatar = null, Job_Title = null) {
    let avatarPath = null;

    if (avatar) {
        const fileExt = avatar.originalname.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `users/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatar.buffer, {
                contentType: avatar.mimetype,
                upsert: false
            });

        if (uploadError) throw uploadError;

        avatarPath = filePath;
    }

    const { data: user, error } = await supabase
        .from("users")
        .insert([
            {
                username,
                email,
                password,
                role: "user",
                avatar: avatarPath,
                Job_Title
            }
        ])
        .select("id, username, email, role, avatar, Job_Title")
        .single();

    if (error) {
        if (avatarPath) {
            await supabase.storage
                .from("avatars")
                .remove([avatarPath]);
        }

        throw error;
    }

    return user;
}
module.exports = { login, register };