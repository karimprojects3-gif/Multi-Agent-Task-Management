
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("users")
        .select("id, username, email, role, Job_Title, avatar");

    if (error) {
        return res.status(500).json({
            message: error.message
        });
    }

    const users = data.map((user) => ({
        ...user,
        avatar: user.avatar
            ? supabase.storage
                .from("avatars")
                .getPublicUrl(
                    user.avatar.replace(
                        /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/avatars\//,
                        ""
                    )
                ).data.publicUrl
            : null
    }));

    res.json(users);
});

module.exports = router;
