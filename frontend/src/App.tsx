import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

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
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminCareers from "./pages/admin/AdminCareers";
import CreateCareer from "./pages/admin/CreateCareer";
import StudyPlans from "./pages/admin/StudyPlans";
import Subjects from "./pages/admin/Subjects";
import Moderation from "./pages/admin/Moderation";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Flow */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Flow */}
        <Route path="/student" element={<Layout role="student" />}>
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
        <Route path="/admin" element={<Layout role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="carreras" element={<AdminCareers />} />
          <Route path="carreras/nueva" element={<CreateCareer />} />
          <Route path="studyplans" element={<StudyPlans />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="moderation" element={<Moderation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
