const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../supabase");
const crypto = require("crypto");
const path = require("path");

// / add new tasks
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "application/zip"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("نوع الملف غير مسموح"));
        }
    }
});

router.post("/", upload.array("attachments", 10), async (req, res) => {

    let uploadedPaths = [];
    let createdTaskId = null;

    try {

        const {
            title,
            description,
            state,
            Priority,
            date_end,
            project_id
        } = req.body;
        const memberIds = req.body.member_ids
            ? JSON.parse(req.body.member_ids)
            : [];
        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "عنوان المهمة مطلوب"
            });
        }

        // 1. إنشاء المهمة
        const { data, error } = await supabase
            .from("tasks")
            .insert({
                title: title.trim(),
                description: description?.trim() || null,
                state: state || "to-do",
                Priority: Priority || "medium",
                date_end: date_end || null,
                project_id: project_id
            })
            .select()
            .single();

        if (error) throw error;

        createdTaskId = data.id;
        // 2. حفظ أعضاء المهمة
        if (memberIds.length > 0) {
            const taskMembers = memberIds.map(userId => ({
                task_id: data.id,
                user_id: userId
            }));

            const { error: taskMembersError } = await supabase
                .from("task_members")
                .insert(taskMembers);

            if (taskMembersError) throw taskMembersError;
        }
        // 2. رفع المرفقات إلى Storage
        const uploadedFiles = [];

        for (const file of (req.files || [])) {

            const extension = path.extname(file.originalname);

            const filePath = `tasks/${data.id}/${crypto.randomUUID()}${extension}`;

            const { error: uploadError } = await supabase
                .storage
                .from("task-files")
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            uploadedPaths.push(filePath);

            uploadedFiles.push({
                file_name: file.originalname,
                file_path: filePath,
                mime_type: file.mimetype,
                file_size: file.size
            });
        }

        // 3. حفظ مسارات المرفقات في نفس جدول tasks
        const { data: updatedTask, error: updateError } = await supabase
            .from("tasks")
            .update({
                attachments: uploadedFiles
            })
            .eq("id", data.id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 4. إرسال المهمة للواجهة
        return res.status(201).json({
            message: "تم إنشاء المهمة بنجاح",
            tasks: updatedTask
        });

    } catch (error) {

        // حذف الملفات التي تم رفعها إذا فشلت العملية
        if (uploadedPaths.length > 0) {
            await supabase.storage
                .from("task-files")
                .remove(uploadedPaths);
        }

        // حذف المهمة إذا فشلت العملية بعد إنشائها
        if (createdTaskId) {
            await supabase
                .from("tasks")
                .delete()
                .eq("id", createdTaskId);
        }

        console.error("Create task error:", error);

        return res.status(500).json({
            message: error.message || "حدث خطأ في السيرفر"
        });
    }
});

// Get task comments
router.get("/:taskId/comments", async (req, res) => {
    try {
        const { taskId } = req.params;

        const { data, error } = await supabase
            .from("task_comments")
            .select(`
                id,
                task_id,
                user_id,
                content,
                created_at,
                users (
                    id,
                    username
                )
            `)
            .eq("task_id", taskId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        return res.status(200).json({
            comments: data
        });

    } catch (error) {
        console.error("Get comments error:", error);

        return res.status(500).json({
            message: "حدث خطأ أثناء جلب التعليقات"
        });
    }
});

// Add task comment
router.post("/:taskId/comments", async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "اكتب تعليق أولاً"
            });
        }

        if (!user_id) {
            return res.status(400).json({
                message: "المستخدم غير محدد"
            });
        }

        // التأكد من وجود المهمة
        const { data: task, error: taskError } = await supabase
            .from("tasks")
            .select("id")
            .eq("id", taskId)
            .maybeSingle();

        if (taskError) throw taskError;

        if (!task) {
            return res.status(404).json({
                message: "المهمة غير موجودة"
            });
        }

        // حفظ التعليق
        const { data, error } = await supabase
            .from("task_comments")
            .insert({
                task_id: taskId,
                user_id,
                content: content.trim()
            })
            .select(`
                id,
                task_id,
                user_id,
                content,
                created_at,
                users (
                    id,
                    username
                )
            `)
            .single();

        if (error) throw error;

        return res.status(201).json({
            message: "تم إضافة التعليق بنجاح",
            comment: data
        });

    } catch (error) {
        console.error("Add comment error:", error);

        return res.status(500).json({
            message: "حدث خطأ أثناء إضافة التعليق"
        });
    }
});

// / get tasks
router.get("/:project_id", async (req, res) => {

    try {

        const { project_id } = req.params;

        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                message: error.message
            });
        }

        return res.status(200).json({
            tasks: data
        });

    } catch (error) {

        console.error("Get tasks error:", error);

        return res.status(500).json({
            message: "حدث خطأ أثناء جلب المهام"
        });

    }

});

// tasks Edit 
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { state } = req.body;

        const { data, error } = await supabase
            .from("tasks")
            .update({ state })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                message: error.message
            });
        }

        res.json({
            message: "Task updated successfully",
            task: data
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});
router.get("/attachment/:taskId/:fileName", async (req, res) => {
    try {
        const { taskId, fileName } = req.params;

        // جلب المهمة من قاعدة البيانات
        const { data: task, error } = await supabase
            .from("tasks")
            .select("attachments")
            .eq("id", taskId)
            .single();

        if (error || !task) {
            return res.status(404).json({ message: "المهمة غير موجودة" });
        }

        // البحث عن الملف
        const file = task.attachments?.find(
            (item) => item.file_name === decodeURIComponent(fileName)
        );

        if (!file) {
            return res.status(404).json({ message: "الملف غير موجود" });
        }

        // إنشاء رابط صالح لمدة 60 ثانية
        const { data, error: urlError } = await supabase.storage
            .from("task-files")
            .createSignedUrl(file.file_path, 60);

        if (urlError) throw urlError;

        return res.json({ url: data.signedUrl });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "حدث خطأ أثناء فتح الملف" });
    }
});

router.get("/:id/members", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: taskMembers, error } = await supabase
            .from("task_members")
            .select("user_id, created_at")
            .eq("task_id", id);

        if (error) throw error;

        const userIds = taskMembers.map(member => member.user_id);

        if (userIds.length === 0) {
            return res.json({ members: [] });
        }

        const { data: users, error: usersError } = await supabase
            .from("users")
            .select("id, username, role")
            .in("id", userIds);

        if (usersError) throw usersError;

        return res.json({
            members: users
        });

    } catch (error) {
        console.error("Get task members error:", error);

        return res.status(500).json({
            message: "حدث خطأ أثناء جلب أعضاء المهمة"
        });
    }
});
module.exports = router;