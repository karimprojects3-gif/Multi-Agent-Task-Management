const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../supabase");

// / add new project  
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("يُسمح برفع الصور فقط"));
        }
    }
});


router.post("/", upload.single("img"), async (req, res) => {
    try {
        const {
            name,
            description,
            end_date,
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "اسم المشروع مطلوب"
            });
        }

        let imagePath = null;

        if (req.file) {
            const fileName = `projects/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

            const { data, error: uploadError } = await supabase.storage
                .from("projects_file")
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error("Image upload error:", uploadError.message);

                return res.status(500).json({
                    message: "فشل رفع صورة المشروع"
                });
            }

            imagePath = data.path;
        }

        const { data, error } = await supabase
            .from("projects")
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                end_date: end_date || null,
                img: imagePath
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error.message);

            return res.status(500).json({
                message: "فشل حفظ المشروع"
            });
        }

        return res.status(201).json({
            message: "تم إنشاء المشروع بنجاح",
            project: data
        });

    } catch (error) {
        console.error("Server error:", error);

        return res.status(500).json({
            message: "حدث خطأ في السيرفر"
        });
    }
});




router.get("/", async (req, res) => {
    try {
        // جلب جميع المشاريع
        const { data: projects, error } = await supabase
            .from("projects")
            .select("*");

        if (error) throw error;

        // إذا لم توجد مشاريع
        if (!projects.length) {
            return res.status(200).json({
                projects: []
            });
        }

        // جلب أعضاء جميع المشاريع
        const projectIds = projects.map(project => project.id);

        const { data: projectMembers, error: membersError } = await supabase
            .from("project_members")
            .select("project_id, user_id, created_at")
            .in("project_id", projectIds);

        if (membersError) throw membersError;

        // جلب بيانات المستخدمين
        const userIds = [
            ...new Set(projectMembers.map(member => member.user_id))
        ];

        let users = [];

        if (userIds.length > 0) {
            const { data, error: usersError } = await supabase
                .from("users")
                .select("id, username")
                .in("id", userIds);

            if (usersError) throw usersError;

            users = data || [];
        }

        // ربط كل عضو بالمستخدم الخاص به
        const membersWithUsers = projectMembers.map(member => ({
            ...member,
            user: users.find(user => user.id === member.user_id) || null
        }));

        // إضافة الأعضاء والصور لكل مشروع
        const projectsWithData = await Promise.all(
            projects.map(async project => {

                const members = membersWithUsers.filter(
                    member => member.project_id === project.id
                );

                let img_url = null;

                if (project.img) {
                    const { data: imageData, error: imageError } =
                        await supabase.storage
                            .from("projects_file")
                            .createSignedUrl(project.img, 3600);

                    if (imageError) {
                        console.error("Image URL error:", imageError.message);
                    } else {
                        img_url = imageData.signedUrl;
                    }
                }

                return {
                    ...project,
                    img_url,
                    members
                };
            })
        );

        return res.status(200).json({
            projects: projectsWithData
        });

    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            message: error.message
        });
    }
});


// 
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return res.status(404).json({
                message: error.message
            });
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// إضافة عضو إلى المشروع
router.post("/:id/members", async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                message: "معرف المستخدم مطلوب"
            });
        }

        const { data, error } = await supabase
            .from("project_members")
            .insert({
                project_id: id,
                user_id: user_id
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return res.status(409).json({
                    message: "هذا العضو موجود بالفعل في المشروع"
                });
            }

            throw error;
        }

        return res.status(201).json({
            message: "تمت إضافة العضو بنجاح",
            member: data
        });

    } catch (error) {
        console.error("Add member error:", error.message);

        return res.status(500).json({
            message: "فشل إضافة العضو"
        });
    }
});


// جلب أعضاء المشروع
router.get("/:id/members", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: members, error } = await supabase
            .from("project_members")
            .select("user_id, created_at")
            .eq("project_id", id);

        if (error) throw error;

        if (members.length === 0) {
            return res.status(200).json({
                members: []
            });
        }

        const userIds = members.map(member => member.user_id);

        const { data: users, error: usersError } = await supabase
            .from("users")
            .select("id, username, email, role")
            .in("id", userIds);

        if (usersError) throw usersError;

        const result = members.map(member => ({
            ...member,
            user: users.find(user => user.id === member.user_id)
        }));

        return res.status(200).json({
            members: result
        });

    } catch (error) {
        console.error("Get members error:", error);

        return res.status(500).json({
            message: "فشل جلب أعضاء المشروع"
        });
    }
});


// حذف عضو من المشروع
router.delete("/:id/members/:userId", async (req, res) => {
    try {
        const { id, userId } = req.params;

        const { data, error } = await supabase
            .from("project_members")
            .delete()
            .eq("project_id", id)
            .eq("user_id", userId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({
                message: "العضو غير موجود في المشروع"
            });
        }

        return res.status(200).json({
            message: "تم حذف العضو بنجاح"
        });

    } catch (error) {
        console.error("Delete member error:", error.message);

        return res.status(500).json({
            message: "فشل حذف العضو"
        });
    }
});


// حذف مشروع
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // جلب المشروع لمعرفة مسار صورته
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, img")
            .eq("id", id)
            .single();

        if (projectError || !project) {
            return res.status(404).json({
                message: "المشروع غير موجود"
            });
        }

        // حذف أعضاء المشروع أولاً
        const { error: membersError } = await supabase
            .from("project_members")
            .delete()
            .eq("project_id", id);

        if (membersError) throw membersError;

        // حذف المشروع
        const { error: deleteError } = await supabase
            .from("projects")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        // حذف صورة المشروع من Storage
        if (project.img) {
            const { error: imageError } = await supabase.storage
                .from("projects_file")
                .remove([project.img]);

            if (imageError) {
                console.error("Image delete error:", imageError.message);
            }
        }

        return res.status(200).json({
            message: "تم حذف المشروع بنجاح"
        });

    } catch (error) {
        console.error("Delete project error:", error);

        return res.status(500).json({
            message: "فشل حذف المشروع"
        });
    }
});

module.exports = router;