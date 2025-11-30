import React, { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import logoImage from "../assets/chatboticon.png";
import onlineicon from "../assets/online icon.png"
import "./ChatbotPage.css";


const ChatbotPage = () => {
  // Controlled input for user's typed message
  const [message, setMessage] = useState("");

 
  // Start with the currently configured bot messages, plus no user messages.
  const initialBotMessages = [
    { text: "How can I help you?", sender: "bot" },
    { text: "Ask me anything", sender: "bot" },
  ];
  const [messages, setMessages] = useState(initialBotMessages);

  // When user types first time, show introduction form from bot
  const [showForm, setShowForm] = useState(false);

  // Refs for scrolling & timer columns
  const chatBodyRef = useRef(null);
  const hoursRef = useRef(null);
  const minsRef = useRef(null);
  const secsRef = useRef(null);

  // Which field is editable (e.g., "msg-0", "welcome")
  const [editableField, setEditableField] = useState(null);

  // Settings object (sourced from localStorage where appropriate)
  const [settings, setSettings] = useState({
    headerColor: localStorage.getItem("headerColor") || "#31475B",
    backgroundColor: localStorage.getItem("chatBgColor") || "#EEEEEE",
    messages: ["How can I help you?", "Ask me anything!"],
    welcomeMessage:
      "👋 Want to chat about Hubly? I'm here to help you find your way.",
    formFields: {
      name: "Your name",
      phone: "+1 (000) 000-0000",
      email: "example@gmail.com",
    },
    missedTimer: { h: "00", m: "00", s: "00" },
  });

  // Intro form state
  const [formData, setFormData] = useState({ name: "", mobile: "", email: "" });

  // Keep chat scrolled to bottom when messages or form visibility changes
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, showForm]);

  
  useEffect(() => {
    setMessages((prevMessages) => {
      const userMessages = prevMessages.filter((m) => m.sender === "user");
      const botMessages = settings.messages.map((msg) => ({ text: msg, sender: "bot" }));
      return [...botMessages, ...userMessages];
    });
    
  }, [settings.messages]);

  // --- Handlers ---

  // Send a user message (from input)
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { text: trimmed, sender: "user" }]);
    setMessage("");
    if (!showForm) setShowForm(true);
  };

  // Submit the intro form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setMessages((prev) => [
      ...prev,
      { text: `Thank you, ${formData.name || "there"}!`, sender: "bot" },
    ]);
    setShowForm(false);
    setFormData({ name: "", mobile: "", email: "" });
  };

  // Persist header color and update settings
  const setHeaderColor = (hex) => {
    setSettings((s) => ({ ...s, headerColor: hex }));
    localStorage.setItem("headerColor", hex);
  };

  // Persist background color and update settings
  const setBackgroundColor = (hex) => {
    setSettings((s) => ({ ...s, backgroundColor: hex }));
    localStorage.setItem("chatBgColor", hex);
  };

  // Start editing a specific input/textarea
  const startEditing = (key) => {
    setEditableField(key);
    // small timeout to ensure element exists before focusing
    window.setTimeout(() => {
      const el = document.querySelector(`[data-edit="${key}"]`);
      if (el) {
        el.focus();
        // place cursor at end for text inputs/areas
        const length = el.value ? el.value.length : 0;
        el.setSelectionRange(length, length);
      }
    }, 0);
  };

  // Save editing / stop edit mode
  const saveEditing = () => setEditableField(null);

  // Save timer (example placeholder)
  const handleSaveTimer = () => {
    alert(
      `Missed chat timer saved: ${settings.missedTimer.h}:${settings.missedTimer.m}:${settings.missedTimer.s}`
    );
  };

  // Update a particular bot message in settings
  const updateMessage = (index, value) => {
    setSettings((s) => {
      const updated = [...s.messages];
      updated[index] = value;
      return { ...s, messages: updated };
    });
  };

  // Update welcome message
  const updateWelcome = (value) =>
    setSettings((s) => ({ ...s, welcomeMessage: value }));

  // --- render ---
  return (
    <div className="chatbot-layout page-container">
      <Sidebar />

      <div className="left-section">
        <h1>Chat Bot</h1>

        <div className="chats-popup" role="dialog" aria-label="short chat popup">
          <button className="closes-btn" aria-label="close">×</button>
          <img src={logoImage} alt="Chatbot" className="chats-popup-top-img" />
          <p>{settings.welcomeMessage}</p>
        </div>

        <div className="chat-window" aria-live="polite" aria-label="chat window">
          <div
            className="chat-header"
            style={{ backgroundColor: settings.headerColor }}
            role="banner"
          >
            <img src={onlineicon} alt="Logo" className="chat-logo" />
            <span className="chat-title">Hubly</span>
          </div>

          <div
            className="chats-body"
            ref={chatBodyRef}
            style={{ backgroundColor: settings.backgroundColor }}
          >
            <div className="chats-top-logo">
              <img src={logoImage} alt="bot" className="chats-top-bot-logo" />
            </div>

            <div className="chats-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chats-message ${msg.sender}`}>
                  <span>{msg.text}</span>
                </div>
              ))}

              {showForm && (
                <div className="chats-message bot form-message" aria-live="polite">
                  <h4>Introduce Yourself</h4>
                  <form onSubmit={handleFormSubmit}>
                    <input
                      type="text"
                      placeholder={settings.formFields.name}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      aria-label="Your name"
                    />
                    <input
                      type="tel"
                      placeholder={settings.formFields.phone}
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      required
                      aria-label="Phone number"
                    />
                    <input
                      type="email"
                      placeholder={settings.formFields.email}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      aria-label="Email address"
                    />
                    <button type="submit">Thank You</button>
                  </form>
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
              aria-label="Type a message"
            />
            <button type="submit" className="sends-btn" aria-label="send">
              <FiSend size={24} />
            </button>
          </form>
        </div>
      </div>

      <div className="right-section">
        {/* Header Color */}
        <div className="setting-card">
          <label className="title">Header Color</label>

          <div className="color-row">
            <button
              type="button"
              className="color white"
              onClick={() => setHeaderColor("#ffffff")}
              aria-label="Set header to white"
            />
            <button
              type="button"
              className="color black"
              onClick={() => setHeaderColor("#000000")}
              aria-label="Set header to black"
            />
            <button
              type="button"
              className="color blue"
              onClick={() => setHeaderColor("#31475B")}
              aria-label="Set header to blue"
            />
          </div>

          <div className="preview-row">
            <div
              className="selected-preview"
              style={{ background: settings.headerColor }}
              aria-hidden="true"
            />
            <input
              type="text"
              readOnly
              value={settings.headerColor}
              className="color-input"
              aria-label="header color value"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="setting-card">
          <label className="title">Custom Background Color</label>

          <div className="color-row">
            <button
              type="button"
              className="color white"
              onClick={() => setBackgroundColor("#ffffff")}
              aria-label="Set background to white"
            />
            <button
              type="button"
              className="color black"
              onClick={() => setBackgroundColor("#000000")}
              aria-label="Set background to black"
            />
            <button
              type="button"
              className="color lightgray"
              onClick={() => setBackgroundColor("#EEEEEE")}
              aria-label="Set background to light gray"
            />
          </div>

          <div className="preview-row">
            <div
              className="selected-preview"
              style={{ background: settings.backgroundColor }}
              aria-hidden="true"
            />
            <input
              type="text"
              readOnly
              value={settings.backgroundColor}
              className="color-input"
              aria-label="background color value"
            />
          </div>
        </div>

        {/* Customize Messages */}
        <div className="setting-card">
          <label className="title">Customize Message</label>

          {settings.messages.map((m, idx) => (
            <div className="message-edit" key={idx}>
              <input
                data-edit={`msg-${idx}`}
                value={m}
                readOnly={editableField !== `msg-${idx}`}
                onChange={(e) => updateMessage(idx, e.target.value)}
                onBlur={() => saveEditing()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveEditing();
                  }
                }}
                aria-label={`Edit bot message ${idx + 1}`}
              />
              <span
                className="edit-icon"
                role="button"
                tabIndex={0}
                onClick={() => startEditing(`msg-${idx}`)}
                onKeyDown={(e) => e.key === "Enter" && startEditing(`msg-${idx}`)}
                aria-label={`Edit message ${idx + 1}`}
              >
                ✎
              </span>
            </div>
          ))}
        </div>

        {/* Intro form preview */}
        <div className="setting-card intro-form">
          <label className="title">Introduction Form</label>

          <div className="intro-field">
            <span className="field-label">Your name</span>
            <input
              type="text"
              value={settings.formFields.name}
              readOnly
              className="field-input"
              aria-label="preview name placeholder"
            />
          </div>

          <div className="intro-field">
            <span className="field-label">Your Phone</span>
            <input
              type="text"
              value={settings.formFields.phone}
              readOnly
              className="field-input"
              aria-label="preview phone placeholder"
            />
          </div>

          <div className="intro-field">
            <span className="field-label">Your Email</span>
            <input
              type="email"
              value={settings.formFields.email}
              readOnly
              className="field-input"
              aria-label="preview email placeholder"
            />
          </div>

          <button
            className="intro-btn"
            onClick={() => alert("Thank you!")}
            aria-label="intro thank you"
          >
            Thank You!
          </button>
        </div>

        {/* Welcome message */}
        <div className="setting-card message">
          <label className="title">Welcome Message</label>
          <div className="message-edit">
            <textarea
              data-edit="welcome"
              rows={3}
              value={settings.welcomeMessage}
              readOnly={editableField !== "welcome"}
              onChange={(e) => updateWelcome(e.target.value)}
              onBlur={() => saveEditing()}
              onKeyDown={(e) => {
                // prevent Enter from creating newline if editing is done by Enter
                if (e.key === "Enter" && editableField === "welcome") {
                  e.preventDefault();
                  saveEditing();
                }
              }}
              aria-label="Edit welcome message"
            />
            <span
              className="edit-icon"
              role="button"
              tabIndex={0}
              onClick={() => startEditing("welcome")}
              onKeyDown={(e) => e.key === "Enter" && startEditing("welcome")}
              aria-label="Edit welcome message"
            >
              ✎
            </span>
          </div>
        </div>

        {/* Timer settings */}
        <div className="setting-cards">
          <label className="title">Missed chat timer</label>

          <div className="timer-picker" aria-hidden="false">
            {[hoursRef, minsRef, secsRef].map((ref, i) => (
              <React.Fragment key={i}>
                {i !== 0 && <span className="colon">:</span>}
                <div className="column scroll" ref={ref}>
                  {[...Array(i === 0 ? 24 : 60)].map((_, index) => {
                    const v = String(index).padStart(2, "0");
                    const key = ["h", "m", "s"][i];
                    const selected = v === settings.missedTimer[key];
                    return (
                      <div
                        key={v}
                        className={selected ? "selected" : ""}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            missedTimer: { ...s.missedTimer, [key]: v },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSettings((s) => ({
                              ...s,
                              missedTimer: { ...s.missedTimer, [key]: v },
                            }));
                          }
                        }}
                      >
                        {v}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>

          <button className="save-btns" onClick={handleSaveTimer}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
