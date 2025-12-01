import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TooltipIcon from "../components/TooltipIcon";
import API from "../api/axios";
import "./SettingPage.css";
import { useAuth } from "../context/AuthContext";

const SettingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const memberToEdit = location.state?.memberToEdit || null;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load Profile

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Admin editing someone else
        if (memberToEdit) {
          const [firstName, ...lastParts] = (memberToEdit.fullName || "").split(
            " "
          );
          setFormData({
            firstName,
            lastName: lastParts.join(" "),
            email: memberToEdit.email,
            password: "",
            confirmPassword: "",
          });
          return;
        }

        // Member editing self
        const userData = JSON.parse(localStorage.getItem("hublyUser"));
        if (!userData) throw new Error("User data missing");

        const [firstName, ...lastParts] = (userData.fullName || "").split(" ");
        setFormData({
          firstName,
          lastName: lastParts.join(" "),
          email: userData.email || "",
          password: "",
          confirmPassword: "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load profile data");
      }
    };

    fetchProfile();
  }, [memberToEdit]);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.firstName || !formData.lastName) {
      return setError("First name and Last name are required");
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    const isAdminEditingMember = memberToEdit && user?.role === "admin";

    const payload = {
      fullName: `${formData.firstName} ${formData.lastName}`,
      email: isAdminEditingMember ? memberToEdit.email : formData.email,
      role: isAdminEditingMember ? memberToEdit.role : user.role,
    };

    if (formData.password) {
      payload.password = formData.password; // update password if filled
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("hublyToken");
      if (!token) return setError("Authentication required");

      if (isAdminEditingMember) {
        // Admin editing another member
        await API.put(`/users/${memberToEdit._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessage(
          "Member updated successfully! Use email as password to login."
        );

        setTimeout(() => {
          navigate("/login"); // redirect admin after edit
        }, 1500);
      } else {
        // Member updating their own profile
        await API.put("/users/me", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // If member changed their own password → login again
        if (formData.password) {
          const loginRes = await API.post("/auth/login", {
            email: formData.email,
            password: formData.password,
          });

          localStorage.setItem("hublyToken", loginRes.data.token);
          login(loginRes.data.user);
        }

        // Redirect member to TeamPage after update
        return navigate("/team");
      }

      // Clear password fields
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="setting-layout">
      <Sidebar />
      <div className="settings-content">
        <h2 className="settings-title">Settings</h2>

        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}

        <form className="settings-card" onSubmit={handleSave}>
          {/* First Name */}
          <div className="input-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          {/* Last Name */}
          <div className="input-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <label>Email</label>
            <div className="input-flex">
              <input type="email" value={formData.email} readOnly />
              <TooltipIcon text="Email cannot be changed" />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Password</label>
            <div className="input-flex">
              <input
                type="password"
                name="password"
                placeholder="******"
                value={formData.password}
                onChange={handleChange}
              />
              <TooltipIcon text="Optional: Fill to change password" />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label>Confirm Password</label>
            <div className="input-flex">
              <input
                type="password"
                name="confirmPassword"
                placeholder="******"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <TooltipIcon text="Re-enter password" />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingPage;






       