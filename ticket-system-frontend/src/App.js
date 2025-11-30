

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MessagePage from "./pages/MessagePage";
import ChatbotPage from "./pages/ChatbotPage";
import TeamPage from "./pages/TeamPage";
import SettingPage from "./pages/SettingPage";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
         <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/message" element={<MessagePage />} />
        <Route path="/chatbox" element={<ChatbotPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/setting" element={<SettingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
