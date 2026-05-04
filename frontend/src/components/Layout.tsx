import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/Layout.css";

interface LayoutProps {
  role: "student" | "admin";
}

const Layout = ({ role }: LayoutProps) => {
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
