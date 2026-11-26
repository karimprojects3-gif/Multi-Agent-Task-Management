
const express = require("express");
const multer = require("multer");

const router = express.Router();
const authController = require("../controllers/auth.controller");

// إعداد استقبال الصور
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("نوع الصورة غير مدعوم"));
        }
    }
});

// تسجيل الدخول
router.post("/login", authController.login);

// إنشاء حساب مع صورة اختيارية
router.post(
    "/register",
    upload.single("avatar"),
    authController.register
);

module.exports = router;
