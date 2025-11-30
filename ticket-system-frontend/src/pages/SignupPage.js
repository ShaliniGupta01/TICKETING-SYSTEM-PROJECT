
// src/pages/SignupPage.js
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./SignupPage.css";
import API from "../api/axios";
import signupImage from "../assets/Image.png";
import logoImage from "../assets/cloud.png";

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!formData.agreeTerms)
    return setError("You must agree to the terms.");

  if (formData.password !== formData.confirmPassword)
    return setError("Passwords do not match!");

  try {
      await API.post("/auth/register", {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: "team",
        username: `${formData.firstName}${Math.floor(Math.random() * 1000)}`,
     });

    alert("Account created successfully!");
    navigate("/login");

  } catch (err) {
    setError(err.response?.data?.message || "Signup failed");
  }
};


  return (
    <div className="signup-page">
      
      {/* Logo */}
      <div className="signup-logo">
        <img src={logoImage} alt="Logo" />
        <span className="logo-text">Hubly</span>
      </div>

      {/* Left Side Form */}
      <div className="signup-form">
        <div className="signup-header">
          <h2>Create an account</h2>
          <span className="signin-link" onClick={() => navigate("/login")}>
            Sign in instead
          </span>
        </div>

       <form onSubmit={handleSubmit}>

  <div className="form-group">
    <label>First name</label>
    <input
      name="firstName"
      value={formData.firstName}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-group">
    <label>Last name</label>
    <input
      name="lastName"
      value={formData.lastName}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-group">
    <label>Email</label>
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-group">
    <label>Password</label>
    <input
      type="password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-group">
    <label>Confirm Password</label>
    <input
      type="password"
      name="confirmPassword"
      value={formData.confirmPassword}
      onChange={handleChange}
      required
    />
  </div>


          <div className="terms-checkbox">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              id="agreeTerms"
            />
            <label htmlFor="agreeTerms">
              By creating an account, I agree to our
              <span className="terms-link"> Terms of Use</span> and
              <span className="privacy-link"> Privacy Policy</span>
            </label>
          </div>

          <button type="submit">Create an account</button>

          {error && <p className="error">{error}</p>}

          <p className="footer-text">
            This site is protected by reCAPTCHA and the Google
            <span className="privacy-link"> Privacy Policy</span> &
            <span className="terms-link"> Terms of Service</span> apply.
          </p>
        </form>
      </div>

      {/* Right Side Image */}
      <div className="signup-image">
        <img src={signupImage} alt="Signup" />
      </div>
    </div>
  );
};

export default SignupPage;
