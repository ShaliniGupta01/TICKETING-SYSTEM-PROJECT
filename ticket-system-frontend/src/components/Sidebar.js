import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaUsers, FaRobot, FaCog, FaEnvelope } from "react-icons/fa";
import { LuHouse, LuCircleUser } from "react-icons/lu";
import { TbChartBar } from "react-icons/tb";
import logoImage from "../assets/cloud.png";
import "./Sidebar.css";

const links = [
  { name: "Dashboard", icon: <LuHouse />, path: "/dashboard" },
  { name: "Contact Center", icon: <FaEnvelope />, path: "/message" },
  { name: "Analytics", icon: <TbChartBar />, path: "/analytics" },
  { name: "Chatbot", icon: <FaRobot />, path: "/chatbox" },
  { name: "Team", icon: <FaUsers />, path: "/team" },
  { name: "Setting", icon: <FaCog />, path: "/setting" },
];

const Sidebar = () => {
  const location = useLocation();
  const [clickedIndex, setClickedIndex] = useState(null);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={logoImage} alt="Logo" />
      </div>

      <div className="sidebar-top-icons">
        {links.map((link, index) => (
          <div key={index} className="sidebar-item-wrapper">
            <Link
              to={link.path}
              className={`sidebar-item ${
                location.pathname === link.path ? "active" : ""
              }`}
              onClick={() => setClickedIndex(index)}
            >
              <div className="icon">{link.icon}</div>
            </Link>
            {(clickedIndex === index || location.pathname === link.path) && (
              <div className="link-name">{link.name}</div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-item-wrapper">
          <Link
            to="/profile"
            className={`sidebar-item ${
              location.pathname === "/profile" ? "active" : ""
            }`}
            onClick={() => setClickedIndex("profile")}
          >
            <div className="icon">
              <LuCircleUser />
            </div>
          </Link>
          {(clickedIndex === "profile" || location.pathname === "/profile") && (
            <div className="link-name">Profile</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
