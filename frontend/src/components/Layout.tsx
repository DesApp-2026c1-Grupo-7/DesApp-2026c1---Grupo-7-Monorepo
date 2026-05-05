import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/Layout.css";

interface LayoutProps {
  role: "student" | "admin";
}

const Layout = ({ role }: LayoutProps) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    // Redirect to their own dashboard if they try to access the wrong role's area
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return (
    <div className="layout">
      <Sidebar role={role} />

      <div className="main">
        <Navbar />

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
