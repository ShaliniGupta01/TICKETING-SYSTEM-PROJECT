
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./LoginPage.css";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import loginImage from "../assets/Image.png";
import logoImage from "../assets/cloud.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", loginData);

      // Store token
      localStorage.setItem("hublyToken", res.data.token);

      // Store user info
      localStorage.setItem(
        "hublyUser",
        JSON.stringify({
          id: res.data.user._id,
          name: res.data.user.fullName,
          role: res.data.user.role,
        })
      );

      login({
        name: res.data.user.fullName,
        role: res.data.user.role,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <img src={logoImage} alt="Logo" />
        <span className="logo-text">Hubly</span>
      </div>
      
      <div className="login-form">
        <div className="name-form">Sign in to your Plexify</div>
        <form onSubmit={handleLogin}>
        <label className="name">Username</label>
          <input
            name="email"
            placeholder=""
            value={loginData.email}
            onChange={handleChange}
            required
          />
          <label className="pass">Password</label>
          <input
            name="password"
            type="password"
            placeholder=""
            value={loginData.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>

        {error && <p className="error">{error}</p>}

        <p>
          Don't have an account?{" "}
          <span className="signup-link" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>

        
       <p className="footer-text">
          This site is protected by reCAPTCHA and the Google
          <span className="privacy-link"> Privacy Policy</span> and
           <span className="terms-link"> Terms of Service</span> apply.
        </p>
      </div>

      <div className="login-image">
        <img src={loginImage} alt="Login" />
      </div>
    </div>
  );
};

export default LoginPage;
