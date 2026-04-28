import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import Navbar from "./Navbar";
import "../styles/Layout.css";

const Layout = () => {
  return (
    <div className="layout">
      <AdminSidebar />

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