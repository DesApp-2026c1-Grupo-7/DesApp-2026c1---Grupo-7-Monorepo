import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./components/ProtectedRoute";

// student
import Layout from "./components/Layout";
import StudentDashboard from "./pages/student/Dashboard";
import Profile from "./pages/student/Profile";
import Situation from "./pages/student/Situation";
import LoadSituation from "./pages/student/LoadSituation";
import AcademicAssistant from "./pages/student/AcademicAssistant";
import Social from "./pages/student/Social";
import StudySessions from "./pages/student/StudySessions";
import CreateSession from "./pages/student/CreateSession";
import Materials from "./pages/student/Materials";
import Notifications from "./pages/student/Notifications";

// admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AcademicOffers from "./pages/admin/AcademicOffers";
import AdminCareers from "./pages/admin/AdminCareers";
import CreateCareer from "./pages/admin/CreateCareer";
import EditCareer from "./pages/admin/EditCareer";
import StudyPlans from "./pages/admin/StudyPlans";
import CreateStudyPlan from "./pages/admin/CreateStudyPlan";
import EditStudyPlan from "./pages/admin/EditStudyPlan";
import StudyPlanDetail from "./pages/admin/StudyPlanDetail";
import Subjects from "./pages/admin/Subjects";
import CreateSubject from "./pages/admin/CreateSubject";
import EditSubject from "./pages/admin/EditSubject";
import Moderation from "./pages/admin/Moderation";

const getActiveUser = (): { role?: string } | null => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (!token || !userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
};

const AuthRedirect = () => {
  const user = getActiveUser();
  if (!user) return <Login />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
};

const RegisterRedirect = () => {
  const user = getActiveUser();
  if (!user) return <Register />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — redirige si ya está logueado */}
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/register" element={<RegisterRedirect />} />

        {/* Student Flow */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <Layout role="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="situation" element={<Situation />} />
          <Route path="load-situation" element={<LoadSituation />} />
          <Route path="assistant" element={<AcademicAssistant />} />
          <Route path="social" element={<Social />} />
          <Route path="sessions" element={<StudySessions />} />
          <Route path="create-session" element={<CreateSession />} />
          <Route path="materials" element={<Materials />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Flow */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <Layout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="carreras" element={<AdminCareers />} />
          <Route path="carreras/nueva" element={<CreateCareer />} />
          <Route path="carreras/editar/:id" element={<EditCareer />} />
          <Route path="studyplans" element={<StudyPlans />} />
          <Route path="studyplans/nuevo" element={<CreateStudyPlan />} />
          <Route path="studyplans/editar/:id" element={<EditStudyPlan />} />
          <Route path="studyplans/:id" element={<StudyPlanDetail />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/nueva" element={<CreateSubject />} />
          <Route path="subjects/editar/:id" element={<EditSubject />} />
          <Route path="ofertas" element={<AcademicOffers />} />
          <Route path="moderation" element={<Moderation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
