const express = require("express");
require("dotenv").config();
const app = express();

// السماح للواجهة على Vite بالاتصال بالسيرفر
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// قراءة البيانات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// <------------------------routes----------------------------------->
// auth routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// projects routes
const projectRoutes = require("./routes/projects");
app.use("/projects", projectRoutes);

// tasks routes
const tasksRoutes = require("./routes/tasks");
app.use("/tasks", tasksRoutes);

// users routes
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

// تشغيل السيرفر
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
