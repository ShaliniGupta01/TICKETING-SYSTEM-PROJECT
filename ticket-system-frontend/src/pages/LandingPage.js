/* eslint-disable no-unused-vars */
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiMail, FiLinkedin, FiTwitter, FiInstagram, FiYoutube, FiSend } from "react-icons/fi";
import { SiDiscord, SiFigma } from "react-icons/si";

import heroImage from "../assets/Hero.png";
import logoImage from "../assets/cloud.png";
import FeatureImage from "../assets/Feature.png";
import FeatureTopImage from "../assets/Feature 2.png";
import topRightImage from "../assets/Card 1.png";
import bottomRightImage from "../assets/Frame 1.png";
import bottomLeftImage from "../assets/Calendar.png";
import crossbtn from "../assets/crossbtn.png";
import button from "../assets/button.png";
import chatbotIcon from "../assets/online icon.png";
import logo from "../assets/chatboticon.png";
import adobeLogo from "../assets/adobe.png";
import elasticLogo from "../assets/elastic.png";
import opendoorLogo from "../assets/opendoor.png";
import airtableLogo from "../assets/airtable.png";
import framerLogo from "../assets/framer.png";

import API from "../api/axios";

const LandingPage = () => {
  const navigate = useNavigate();

  // Chat UI states
  const [showChatBot, setShowChatBot] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [showIntroPopup, setShowIntroPopup] = useState(true);

  // Ticket + Chat states
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [formCompleted, setFormCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const chatBodyRef = useRef(null);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
  });

  // Chat design
  const [headerColor, setHeaderColor] = useState("#0064FF");
  const [chatBgColor, setChatBgColor] = useState("#ffffff");

  // First message temporarily
  const [firstMessage, setFirstMessage] = useState("");

  const settings = {
    headerColor: "#093270ff",
    backgroundColor: "#fff",
    formFields: {
      name: "Your name",
      phone: "+1 (000) 000-0000",
      email: "example@gmail.com",
    },
  };

  // Load saved colors
  useEffect(() => {
    const savedHeader = localStorage.getItem("headerColor");
    const savedBg = localStorage.getItem("chatBgColor");

    if (savedHeader) setHeaderColor(savedHeader);
    if (savedBg) setChatBgColor(savedBg);
  }, []);

  // Toggle Chat Window
  const toggleChat = () => {
    setChatOpen((prev) => !prev);
    if (!chatOpen) setShowIntroPopup(false);
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    // First ever message → show form
    if (!formCompleted && !showForm) {
      setFirstMessage(userMessage);
      setShowForm(true);
      return;
    }

    if (!ticketId) {
      console.warn("Ticket not yet created. Wait for form submit.");
      return;
    }

    try {
      await API.put(`/tickets/${ticketId}/reply`, {
        message: userMessage,
        noAssign: true,
      });

      setMessages((prev) => [...prev, { sender: "bot", text: "Message delivered" }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "bot", text: "Message could not be delivered." }]);
    }
  };

  // Submit Intro Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setShowForm(false);
    setFormCompleted(true);

    try {
      const res = await API.post("/tickets", {
        name: formData.name,
        email: formData.email,
        phone: formData.mobile,
        text: firstMessage || "Initial message",
      });

      const newTicketId = res.data.ticketId;
      if (!newTicketId) throw new Error("Ticket creation failed");

      setTicketId(newTicketId);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `Thanks! Your details are saved. Ticket ID: TCT${newTicketId}` },
      ]);
      setFirstMessage("");
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Could not create ticket. Please try again." },
      ]);
    }
  };

  // Hide chatbot on scroll past hero
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = document.querySelector(".hero-section")?.offsetHeight || 0;
      setShowChatBot(window.scrollY <= heroHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="logo">
          <img src={logoImage} alt="Hubly Logo" className="logo-img" />
          <span className="logo-text">Hubly</span>
        </div>
        <nav>
          <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
          <button className="signup-btn" onClick={() => navigate("/signup")}>Sign up</button>
        </nav>
      </header>

      {/* Hero + Chatbot */}
      <section className="hero-section">
        {showChatBot && (
          <div className="chatbot-container">
            <img
              src={chatOpen ? crossbtn : button}
              alt="Chatbot"
              className="chatbot-icon"
              onClick={toggleChat}
            />

            {showIntroPopup && (
              <div className="chat-popup">
                <button className="closebtn" onClick={() => setShowIntroPopup(false)}>×</button>
                <img src={logo} className="chat-popup-top-img" alt="Bot" />
                <p>👋 Want to chat about Hubly? I'm here to help you!</p>
              </div>
            )}

            {chatOpen && (
              <div className="chats-window">
                <div className="chat-header" style={{ backgroundColor: headerColor }}>
                  <img src={chatbotIcon} alt="Bot" className="chat-logo" />
                  <span className="chat-title">Hubly</span>
                </div>

                <div className="chats-body" style={{ backgroundColor: chatBgColor }} ref={chatBodyRef}>
                  <div className="chats-messages">
                    {messages.map((msg, i) => (
                      <div key={i} className={`chats-message ${msg.sender}`}>
                        <span>{msg.text}</span>
                      </div>
                    ))}

                    {showForm && (
                      <div className="chats-message bot form-message intro-wrapper">
                        <img src={logo} alt="Bot Logo" className="intro-logo" />
                        <div className="intro-content">
                          <div className="intro-form-wrapper">
                            <label className="intro-title">Introduce Yourself</label>
                            <form onSubmit={handleFormSubmit} className="intro-chat-form">
                              <div className="intro-field">
                                <span className="field-label">Your name</span>
                                <input
                                  type="text"
                                  placeholder={settings.formFields.name}
                                  value={formData.name}
                                  required
                                  className="field-input"
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                              </div>

                              <div className="intro-field">
                                <span className="field-label">Your Phone</span>
                                <input
                                  type="tel"
                                  placeholder={settings.formFields.phone}
                                  value={formData.mobile}
                                  required
                                  className="field-input"
                                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                />
                              </div>

                              <div className="intro-field">
                                <span className="field-label">Your Email</span>
                                <input
                                  type="email"
                                  placeholder={settings.formFields.email}
                                  value={formData.email}
                                  required
                                  className="field-input"
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                              </div>

                              <button type="submit" className="intro-btn">Thank You!</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <form className="chats-input-container" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button type="submit" className="sends-btn" aria-label="send">
                    <FiSend size={24} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Hero Content */}
        <div className="hero-left">
          <h1>
            Grow Your Business Faster with <span className="highlight-text">Hubly CRM</span>
          </h1>
          <p>Manage leads, automate workflows, and close deals effortlessly—all in one platform.</p>

          <div className="hero-buttons">
            <button className="primary-btn">Get started →</button>
            <button className="secondary-btn">
              <span className="icon-circle">▶</span> Watch Video
            </button>
          </div>
        </div>

        <div className="hero-right">
          <img src={heroImage} alt="CRM Dashboard" className="hero-main-img" />
          <img src={topRightImage} alt="Top Right" className="hero-overlay top-right" />
          <img src={bottomRightImage} alt="Bottom Right" className="hero-overlay bottom-right" />
          <img src={bottomLeftImage} alt="Bottom Left" className="hero-overlay bottom-left" />
        </div>
      </section>

      {/* Partners Section */}
      <section className="partners-section">
        <div className="partners-container">
          {[adobeLogo, elasticLogo, opendoorLogo, airtableLogo, elasticLogo, framerLogo].map((logo, i) => (
            <div className="partner-card" key={i}>
              <img src={logo} alt="Partner" />
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>At its core, Hubly is a robust CRM solution.</h2>
        <p className="feature-subtext">
          Hubly helps businesses streamline customer interactions, track leads and automate tasks — saving you time and maximizing revenue.
        </p>

        <div className="feature-wrapper">
          <div className="features-left">
            <div className="single-feature">
              <h3>MULTIPLE PLATFORMS TOGETHER!</h3>
              <p>Email communication is a breeze with drag & drop builder.</p>
            </div>
            <div className="single-feature">
              <h3>CLOSE</h3>
              <p>Capture leads with landing pages, phone system & more!</p>
            </div>
            <div className="single-feature">
              <h3>NURTURE</h3>
              <p>Convert leads using smart workflows and automation!</p>
            </div>
          </div>

          <div className="features-right">
            <img src={FeatureTopImage} alt="Feature" className="feature-top-img" />
            <img src={FeatureImage} alt="feature preview" className="feature-img" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <h2>We have plans for everyone!</h2>
        <p>Built with all sales and marketing tools inside one platform.</p>

        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>STARTER</h3>
            <p>Best for local businesses needing improved reputation.</p>
            <p className="price">$199 <span>/month</span></p>
            <p>What’s included</p>
            <ul>
              <li>Unlimited Users</li>
              <li>GMB Messaging</li>
              <li>Reputation Management</li>
              <li>Call Tracking</li>
              <li>24/7 Support</li>
            </ul>
            <button>SIGN UP FOR STARTER</button>
          </div>

          <div className="pricing-card">
            <h3>GROW</h3>
            <p>Full automation & lead tracking tools included.</p>
            <p className="price">$399 <span>/month</span></p>
            <p>What’s included</p>
            <ul>
              <li>Pipeline Management</li>
              <li>Automation Campaigns</li>
              <li>Live Call Transfer</li>
              <li>GMB Messaging</li>
              <li>Form Builder</li>
              <li>Reputation Management</li>
              <li>24/7 Support</li>
            </ul>
            <button>SIGN UP FOR GROW</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <div className="logo">
            <img src={logoImage} alt="Hubly Logo" className="logo-img" />
            <span className="logo-text">Hubly</span>
          </div>
        </div>

        <div className="footer-right">
          <ul className="footer-links">
            <li>Product
              <ul className="footer-sub">
                <li>Universal checkout</li>
                <li>Payment workflows</li>
                <li>Observability</li>
                <li>UpliftAI</li>
                <li>Apps & integrations</li>
              </ul>
            </li>
            <li>Why Primer
              <ul className="footer-sub">
                <li>Expand to new markets</li>
                <li>Boost success rates</li>
                <li>Improve conversion</li>
                <li>Reduce fraud</li>
                <li>Recover revenue</li>
              </ul>
            </li>
            <li>Developers
              <ul className="footer-sub">
                <li>Docs</li>
                <li>API References</li>
                <li>Methods guide</li>
                <li>Status</li>
                <li>Community</li>
              </ul>
            </li>
            <li>Resources
              <ul className="footer-sub">
                <li>Blog</li>
                <li>Careers</li>
                <li>Success stories</li>
                <li>Terms</li>
                <li>Privacy</li>
              </ul>
            </li>
            <li>Company
              <ul className="footer-sub">
                <li>Careers</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="footer-social">
          <FiMail /><FiLinkedin /><FiTwitter /><FiYoutube /><SiDiscord /><SiFigma /><FiInstagram />
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
