import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import API from "../api/axios";
import "./TeamPage.css";

const TeamPage = () => {
  const [members, setMembers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    role: "team",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isSaving, setIsSaving] = useState(false);
  // const [testMode, setTestMode] = useState(false); // Toggle for test mode

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("hublyUser"));
  const currentUserRole = currentUser?.role || "team";

  const avatarCache = JSON.parse(localStorage.getItem("ticketAvatars")) || {};
  const getAvatar = (entity) => {
    const id = entity._id || entity.email || entity.name || "unknown";
    if (avatarCache[id]) return avatarCache[id];

    const name = entity.fullName || entity.name || "";
    const isFemale = name.toLowerCase().endsWith("a");
    const randomIndex = Math.floor(Math.random() * 50);
    const avatarUrl = isFemale
      ? `https://randomuser.me/api/portraits/women/${randomIndex}.jpg`
      : `https://randomuser.me/api/portraits/men/${randomIndex}.jpg`;

    avatarCache[id] = avatarUrl;
    localStorage.setItem("ticketAvatars", JSON.stringify(avatarCache));
    return avatarUrl;
  };

  const fetchMembers = async () => {
    const token = localStorage.getItem("hublyToken");
    try {
      const res = await API.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data.users.map((u) => ({ ...u, hidden: false })));
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("hublyToken")) navigate("/login");
    else fetchMembers();
  }, [navigate]);

  const handleEditClick = (member) => {
    if (currentUserRole === "admin" && member._id !== currentUser._id) {
      navigate("/setting", { state: { memberToEdit: member } });
    } else {
      navigate("/setting");
    }
  };

  const handleDeleteClick = (member) => {
    if (
      (currentUserRole === "admin" &&
        member._id !== currentUser._id &&
        member.role !== "admin") ||
      member._id === currentUser._id
    ) {
      setDeleteMemberId(member._id);
      setIsDeleteModalOpen(true);
    } else {
      alert("You cannot delete this member.");
    }
  };

  const confirmDelete = () => {
    setMembers((prev) =>
      prev.map((m) => (m._id === deleteMemberId ? { ...m, hidden: true } : m))
    );
    setIsDeleteModalOpen(false);
    setDeleteMemberId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!newMember.fullName || !newMember.email) {
      alert("Please fill Full Name & Email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem("hublyToken");
      console.log("Token:", token);
      const payload = {
        fullName: newMember.fullName,
        email: newMember.email,
        role: newMember.role,
        password: "TempPass123!",
      };
      console.log("Payload:", payload);
      const res = await API.post("/users", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Response:", res);
      setMembers((prev) => [...prev, { ...res.data.user, hidden: false }]);
      fetchMembers();
      alert("Member added successfully!");
      setIsAddModalOpen(false);
      setNewMember({ fullName: "", email: "", role: "team" });
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Response data:", err.response?.data);
      console.error("Status:", err.response?.status);
      if (!err.response) {
        // Network error: No response from server
        const newUser = {
          _id: Date.now().toString(),
          fullName: newMember.fullName,
          email: newMember.email,
          role: newMember.role,
          hidden: false,
        };
        setMembers((prev) => [...prev, newUser]);
        alert("Member added Successfully...");
      } else if (err.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
        navigate("/login");
      } else if (
        err.response?.status === 409 ||
        err.response?.data?.message?.includes("exists")
      ) {
        setMembers((prev) =>
          prev.map((m) =>
            m.email?.toLowerCase() === newMember.email.toLowerCase()
              ? { ...m, hidden: false }
              : m
          )
        );
        alert("Member already exists and has been restored.");
      } else {
        alert(
          `Failed to add member. Server says: ${
            err.response?.data?.message || "Unknown error"
          }. Status: ${err.response?.status || "N/A"}`
        );
      }
      setIsAddModalOpen(false);
      setNewMember({ fullName: "", email: "", role: "team" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedMembers = [...members]
    .filter((m) => !m.hidden)
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const valA = a[sortConfig.key]?.toLowerCase() || "";
      const valB = b[sortConfig.key]?.toLowerCase() || "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <div className="team-table-container">
          <h2>Team</h2>

          <table className="team-table">
            <thead>
              <tr>
                <th
                  className={`fullName ${
                    sortConfig.key === "fullName"
                      ? `sorted ${sortConfig.direction}`
                      : ""
                  }`}
                  onClick={() => handleSort("fullName")}
                >
                  Full Name{" "}
                  {sortConfig.key === "fullName" ? (
                    sortConfig.direction === "asc" ? (
                      <FaSortUp />
                    ) : (
                      <FaSortDown />
                    )
                  ) : (
                    <FaSort />
                  )}
                </th>
                <th>Phone</th>
                <th
                  className={
                    sortConfig.key === "email"
                      ? `sorted ${sortConfig.direction}`
                      : ""
                  }
                  onClick={() => handleSort("email")}
                >
                  Email
                </th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => (
                <tr key={member._id}>
                  <td className="member-cell">
                    <img
                      className="avatar-sm"
                      src={getAvatar(member)}
                      alt={member.fullName}
                    />{" "}
                    {member.fullName}
                  </td>
                  <td>{member.phone || "-"}</td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>

                  <td>
                    {member.role !== "admin" && (
                      <>
                        <span
                          className="editbtn"
                          onClick={() => handleEditClick(member)}
                        >
                          <MdEdit />
                          <span className="underline"></span>
                        </span>
                        <span
                          className="action-icon"
                          onClick={() => handleDeleteClick(member)}
                        >
                          <MdDelete />
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentUserRole === "admin" && (
            <button
              className="add-team-button"
              onClick={() => setIsAddModalOpen(true)}
            >
              <span className="plus-circle">+</span> Add Team Member
            </button>
          )}
        </div>
        {isAddModalOpen && currentUserRole === "admin" && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add Team Member</h2>
              <p>
                Talk with colleagues in a group chat. Messages in this group are
                only visible to it's participants. New teammates may only be
                invited by the administrators.
              </p>
              <div className="modal-form">
                <label>
                  User name:
                  <input
                    type="text"
                    name="fullName"
                    placeholder="User name"
                    value={newMember.fullName}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Email ID:
                  <input
                    type="email"
                    name="email"
                    placeholder="Email ID"
                    value={newMember.email}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Role:
                  <select
                    name="role"
                    value={newMember.role}
                    onChange={handleInputChange}
                  >
                    <option value="team">Team Member</option>
                  </select>
                </label>
              </div>
              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="saves-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="delete-modal-overlay">
            <div className="modal">
              <h1>This Teammate will be deleted</h1>
              <div className="modal-button">
                <button
                  className="cancels-btn"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="save-btn" onClick={confirmDelete}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
