import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, } from "react-router-dom";
import "./App.css";


// Loading
import Loading from "../components/Loading/Loading";

// login
import Login from "../pages/login/login";

// register
import Register from "../pages/register/register";

// Layout
import Layout from "../pages/Layout/Layout";

// Home
import Home from "../pages/home/home";

// projects
import Projects from "../pages/projects/projects";

// members
import Members from "../pages/members/members";

// Ai
import Ai from "../pages/ai/ai";

// tasks
import ProjectDetails from "../pages/tasks/ProjectDetails.jsx";


export default function App() {

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {isLoading ? (<Loading />) : (

        <Routes>
          {/* أول صفحة: تسجيل الدخول */}
          <Route path="/" element={<Login />} />

          {/* أي رابط آخر يرجع لصفحة تسجيل الدخول */}
          <Route path="*" element={<Login />} />

          {/* صفحة انشاء حساب  */}
          <Route path="/register" element={<Register />} />


          {/*(layout) الداشبورد*/}
          <Route path="/layout" element={<Layout />}>
            {/* (home) الصفحة الرئيسية داخل الداشبورد */}

            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />

            {/* (projects) المشاريع داخل الداشبورد */}

            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<Projects />} />

            {/* (AI) الذكاء الاصطناعي داخل الداشبورد */}

            <Route index element={<Navigate to="ai" replace />} />
            <Route path="ai" element={<Ai />} />

            {/* (members) المشاريع داخل الداشبورد */}

            <Route index element={<Navigate to="members" replace />} />
            <Route path="members" element={<Members />} />


            <Route path="/layout/projects/:id" element={<ProjectDetails />} />

          </Route>

        </Routes>

      )}
    </BrowserRouter>
  );
}
