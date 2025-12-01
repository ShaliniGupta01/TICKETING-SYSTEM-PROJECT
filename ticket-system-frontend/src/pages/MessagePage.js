import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaPhone, FaEnvelope, FaHome } from "react-icons/fa";
import API from "../api/axios";
import "./MessagePage.css";

// Cache for avatars
const avatarCache = JSON.parse(localStorage.getItem("ticketAvatars")) || {};

const MessagePage = () => {
  // ----- State Variables -----
  const [tickets, setTickets] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [allTeammates, setAllTeammates] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState(null);
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [showReassignPopup, setShowReassignPopup] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showResolveConfirmPopup, setShowResolveConfirmPopup] = useState(false);
  const [showUnresolveConfirmPopup, setShowUnresolveConfirmPopup] =
    useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [missedTimerInSeconds, setMissedTimerInSeconds] = useState(300); // 5 min default

  const navigate = useNavigate();
  const location = useLocation();
  const ticketFromDashboard = location.state?.ticket;

  // ----- Initialization -----
  useEffect(() => {
    const token = localStorage.getItem("hublyToken");
    const user = JSON.parse(localStorage.getItem("hublyUser") || null);
    if (user) {
      setCurrentUser(user);
      setUserRole(user.role);
    }

    const timer = JSON.parse(localStorage.getItem("hublyChatTimer")) || {
      h: "00",
      m: "05",
      s: "00",
    };
    setMissedTimerInSeconds(
      parseInt(timer.h) * 3600 + parseInt(timer.m) * 60 + parseInt(timer.s)
    );

    const fetchTickets = async () => {
      try {
        const res = await API.get("/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(res.data);
        if (!ticketFromDashboard && res.data.length > 0)
          setSelectedChat(res.data[0]);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };
    fetchTickets();
  }, [ticketFromDashboard]);

  // Fetch teammates (admin only)
  useEffect(() => {
    if (!currentUser || userRole !== "admin") return;

    const fetchTeammates = async () => {
      try {
        const token = localStorage.getItem("hublyToken");
        const res = await API.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filtered = res.data.users.filter(
          (u) => u._id !== currentUser._id && u.role === "team"
        );
        setAllTeammates(filtered);
      } catch (err) {
        console.error("Error fetching teammates:", err);
      }
    };
    fetchTeammates();
  }, [currentUser, userRole]);

  // ----- Missed Timer Logic -----
  const startMissedTimer = useCallback(
    (msg) => {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msg._id && !m.replied ? { ...m, isMissed: true } : m
          )
        );
      }, missedTimerInSeconds * 1000);
    },
    [missedTimerInSeconds]
  );

  // ----- Fetch Messages -----
  useEffect(() => {
    if (!selectedChat) return;

    const msgs = Array.isArray(selectedChat.messages)
      ? selectedChat.messages
      : [];
    setMessages(
      msgs.length > 0
        ? msgs
        : [
            { _id: "test1", sender: "user", text: "Test user message" },
            { _id: "test2", sender: "team", text: "Test team message" },
          ]
    );

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("hublyToken");
        const res = await API.get(`/messages/${selectedChat.ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = Array.isArray(res.data) ? res.data : [];
        const finalMessages = fetched.length === 0 ? msgs : fetched;

        setMessages(finalMessages);
        finalMessages.forEach((msg) => {
          if (msg.sender === "user" && !msg.replied) startMissedTimer(msg);
        });
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (Array.isArray(selectedChat.messages)) {
          setMessages(selectedChat.messages);
          selectedChat.messages.forEach((msg) => {
            if (msg.sender === "user" && !msg.replied) startMissedTimer(msg);
          });
        } else setMessages([]);
      }
    };

    fetchMessages();
  }, [selectedChat, startMissedTimer]);

  // ----- Utilities -----
  const getMessageDate = (msg) => {
    const d =
      msg.createdAt ||
      msg.timestamp ||
      msg.sentAt ||
      msg.date ||
      msg.time ||
      null;
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getAvatar = (entity) => {
    const id = entity._id || entity.name || entity.email || "unknown";
    if (avatarCache[id]) return avatarCache[id];

    const name = entity.name || "";
    const isFemale = name.toLowerCase().endsWith("a");
    const randomIndex = Math.floor(Math.random() * 50);
    const avatarUrl = isFemale
      ? `https://randomuser.me/api/portraits/women/${randomIndex}.jpg`
      : `https://randomuser.me/api/portraits/men/${randomIndex}.jpg`;

    avatarCache[id] = avatarUrl;
    localStorage.setItem("ticketAvatars", JSON.stringify(avatarCache));
    return avatarUrl;
  };

  const canSend = () => {
    if (!selectedChat || !currentUser) return false;
    const isOwner =
      selectedChat?.user?._id?.toString() === currentUser._id?.toString();
    const isAssigned =
      selectedChat?.assignedTo?._id?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser?.role === "admin";
    return (
      !["resolved", "closed"].includes(selectedChat.status) &&
      (isOwner || isAssigned || isAdmin)
    );
  };

  const getMessageOwner = (msg) => {
    if (!msg.sender) return null;
    const customer = selectedChat?.createdBy || selectedChat?.user;
    const assigned = selectedChat?.assignedTo;
    const senderId =
      typeof msg.sender === "object" ? msg.sender._id : msg.sender;

    if (currentUser && senderId && String(senderId) === String(currentUser._id))
      return {
        role: currentUser.role,
        name: currentUser.name,
        avatar: getAvatar(currentUser),
      };

    if (
      msg.sender === "user" ||
      (customer?._id && String(senderId) === String(customer._id))
    )
      return {
        role: "user",
        name: customer?.name || selectedChat?.name || "Customer",
        avatar: getAvatar(customer || selectedChat),
      };

    if (assigned?._id && String(senderId) === String(assigned._id))
      return { role: "team", name: assigned.name, avatar: getAvatar(assigned) };

    if (msg.sender === "system")
      return {
        role: "system",
        name: "System",
        avatar: getAvatar({ name: "System" }),
      };

    return null;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || !canSend()) return;
    try {
      const token = localStorage.getItem("hublyToken");
      const payload = { text: newMessage };
      const res = await API.post(
        `/messages/${selectedChat.ticketId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const savedMessage = res.data.message || res.data;
      const updatedMessages = messages.map((m) =>
        m.sender === "user" && m.isMissed ? { ...m, replied: true } : m
      );
      setMessages([...updatedMessages, savedMessage]);
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
      alert(
        `Error sending message: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const canAssign = () => currentUser?.role === "admin";
  const canChangeStatus = () => {
    if (!selectedChat) return false;
    const assignedId = selectedChat.assignedTo?._id?.toString();
    const currentId = currentUser?._id?.toString();
    return currentUser?.role === "admin" || assignedId === currentId;
  };

  const getMemberFullName = (member) =>
    member?.name ||
    member?.fullName ||
    member?.username ||
    member?.email ||
    "Unknown";

  const selectAssignee = (member) => {
    if (!canAssign() || member.role === "admin") return;

    setPendingAssignee({
      _id: member._id,
      name: getMemberFullName(member),
      role: member.role,
      email: member.email || "",
    });

    if (selectedChat.assignedTo) {
      setShowReassignPopup(true);
    } else {
      setShowAssignPopup(true);
    }

    setDropdownOpen(false); // close dropdown after selection
  };

  const confirmAssign = async () => {
    if (!pendingAssignee || !selectedChat) return;

    try {
      const token = localStorage.getItem("hublyToken");
      const res = await API.put(
        `/tickets/assign/${selectedChat.ticketId}`,
        { assignedTo: pendingAssignee._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedTicket = res.data.ticket;

      // Use pendingAssignee to ensure name is correct
      const fullAssignedUser = {
        _id: updatedTicket.assignedTo._id,
        name: pendingAssignee.name,
        role: updatedTicket.assignedTo.role,
        email: updatedTicket.assignedTo.email || "",
      };

      setSelectedChat((prev) => ({
        ...prev,
        assignedTo: fullAssignedUser,
      }));

      setTickets((prev) =>
        prev.map((t) =>
          t._id === updatedTicket._id
            ? { ...t, assignedTo: fullAssignedUser }
            : t
        )
      );

      alert(
        `Assignment successful. ${pendingAssignee.name} can now log in to chat.`
      );
      setPendingAssignee(null);
      setShowAssignPopup(false);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Assign error:", err);
    }
  };

  const confirmReassign = async () => {
    if (!pendingAssignee || !selectedChat) return;

    try {
      const token = localStorage.getItem("hublyToken");
      const res = await API.put(
        `/tickets/assign/${selectedChat.ticketId}`,
        { assignedTo: pendingAssignee._id, isReassign: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedTicket = res.data.ticket;

      const fullAssignedUser = {
        _id: updatedTicket.assignedTo._id,
        name: pendingAssignee.name,
        role: updatedTicket.assignedTo.role,
        email: updatedTicket.assignedTo.email || "",
      };

      setSelectedChat((prev) => ({
        ...prev,
        assignedTo: fullAssignedUser,
        messages: [], // clear messages if reassigned
      }));

      setTickets((prev) =>
        prev.map((t) =>
          t._id === updatedTicket._id
            ? { ...t, assignedTo: fullAssignedUser, messages: [] }
            : t
        )
      );

      alert(
        `Reassignment successful. ${pendingAssignee.name} can now log in to chat.`
      );
      setPendingAssignee(null);
      setShowReassignPopup(false);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Reassign error:", err);
    }
  };

  const handleStatusChange = (e) => {
    if (!canChangeStatus()) return;
    const value = e.target.value;
    if (value === "closed") setShowClosePopup(true);
    else {
      setTicketStatus(value);
      setSelectedChat((prev) => ({ ...prev, status: value }));
    }
  };

  const confirmClose = () => {
    if (!canChangeStatus()) return;
    setSelectedChat((prev) => ({ ...prev, status: "closed" }));
    setTicketStatus("closed");
    setShowClosePopup(false);
  };

  const confirmResolve = async () => {
    if (!canChangeStatus()) return;
    try {
      const token = localStorage.getItem("hublyToken");
      await API.put(
        `/tickets/${selectedChat.ticketId}/status`,
        { status: "resolved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedChat((prev) => ({
        ...prev,
        status: "resolved",
        isReadOnly: true,
        messages: [
          ...(prev.messages || []),
          {
            sender: "system",
            text: "This chat has been resolved.",
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === selectedChat.ticketId
            ? { ...t, status: "resolved" }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      alert("Error resolving ticket.");
    }
  };

  const markUnresolved = async () => {
    if (!canChangeStatus()) return;
    try {
      const token = localStorage.getItem("hublyToken");
      await API.put(
        `/tickets/${selectedChat.ticketId}/status`,
        { status: "open" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedChat((prev) => ({
        ...prev,
        status: "open",
        isReadOnly: false,
        messages: [
          ...(prev.messages || []),
          {
            sender: "system",
            text: "This chat has been marked unresolved.",
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === selectedChat.ticketId ? { ...t, status: "open" } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const teammatesToShow =
    currentUser?.role === "admin"
      ? allTeammates // admin sees all team members
      : [currentUser]; // member sees only themselves

  // ----- Render -----
  return (
    <div className="message-layout">
      <Sidebar />

      {/* Chat List */}
      <div className="contact-panel">
        <h3 className="panel-title">Contact Center</h3>
        <h4 className="heading">Chats</h4>
        <div className="chat-list">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className={`chat-item ${
                selectedChat?._id === ticket._id ? "active" : ""
              }`}
              onClick={() => setSelectedChat(ticket)}
            >
              <img
                className="avatar-sm"
                src={getAvatar(ticket)}
                alt={ticket.name}
              />
              <div className="chat-text">
                <p className="chat-name">{ticket.name}</p>
                <p className="ticket-preview">
                  {ticket.messages?.length > 0
                    ? ticket.messages[ticket.messages.length - 1].text.slice(
                        0,
                        25
                      ) + "..."
                    : "No messages yet"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-windows">
        {selectedChat ? (
          <>
            <div className="ticket-headers">
              Ticket# {selectedChat.ticketId}
              <FaHome
                className="home-icon"
                onClick={() => navigate("/login")}
              />
            </div>

            <div className="chat-bodys">
              {!["resolved", "closed"].includes(selectedChat.status) &&
                Array.isArray(messages) &&
                messages.map((msg, index) => {
                  const currentDate = getMessageDate(msg);
                  const previousDate =
                    index > 0 ? getMessageDate(messages[index - 1]) : null;
                  const showDate = currentDate && currentDate !== previousDate;

                  const owner = getMessageOwner(msg);
                  if (!owner) return null;

                  const isRight =
                    owner.role === "team" || owner.role === "admin";

                  return (
                    <React.Fragment key={msg._id || Math.random()}>
                      {showDate && (
                        <div className="date-divider">{currentDate}</div>
                      )}

                      {selectedChat.assignedTo && (
                        <div className="chat-teammate-info"></div>
                      )}

                      <div
                        className={`chat-message ${
                          isRight ? "team-msg" : "customer-msg"
                        }`}
                      >
                        <img
                          className="avatar"
                          src={owner.avatar}
                          alt={owner.name}
                        />
                        {msg.isMissed && !msg.replied && (
                          <div className="missed-chat-banner">
                            Replying to missed chat
                          </div>
                        )}

                        <div className="msg-content">
                          {!isRight && (
                            <p className="msg-senders">{owner.name}</p>
                          )}

                          <div className="msg-bubbles">
                            {msg.text ||
                              msg.message ||
                              msg.content ||
                              "No text available"}
                          </div>

                          {isRight && (
                            <p className="msg-senders team-name">
                              {owner.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

              {/* Show alert for reassigned if no messages and assigned */}
              {Array.isArray(messages) &&
                messages.length === 0 &&
                selectedChat.assignedTo && (
                  <p className="alert-reassigned">
                    This chat is assigned to new team member. you no longer have
                    access
                  </p>
                )}

              {/* Show alert for resolved/closed */}
              {["resolved", "closed"].includes(selectedChat.status) && (
                <p className="alert-disabled">This chat has been resolved</p>
              )}
            </div>

            <div className="chat-footer">
              {selectedChat &&
                currentUser &&
                !["resolved", "closed"].includes(selectedChat.status) &&
                messages.length > 0 && (
                  <div className="input-wrapper">
                    <input
                      value={newMessage}
                      disabled={!canSend()}
                      placeholder={
                        canSend()
                          ? "Type a message..."
                          : "You cannot reply to this ticket"
                      }
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                      className="send-btn"
                      disabled={!canSend()}
                      onClick={handleSend}
                    >
                      ➤
                    </button>
                  </div>
                )}
            </div>
          </>
        ) : (
          <p className="no-chat">Select a chat</p>
        )}
      </div>

      {/* Details Panel */}
      <div className="details-panel">
        {selectedChat && (
          <>
            <div className="details-header">
              <img
                className="avatar"
                src={getAvatar(selectedChat)}
                alt={selectedChat.name}
              />
              <span className="user-name">{selectedChat.name}</span>
            </div>
            <div className="details-block">
              <h3>Details</h3>

              <div className="detail-item">
                <span className="detail-icon">
                  <FaUser />
                </span>
                <span className="detail-label">{selectedChat.name}</span>
              </div>

              <div className="detail-item">
                <span className="detail-icon">
                  <FaPhone />
                </span>
                <span className="detail-label">{selectedChat.phone}</span>
              </div>

              <div className="detail-item">
                <span className="detail-icon">
                  <FaEnvelope />
                </span>
                <span className="detail-label">{selectedChat.email}</span>
              </div>
            </div>

            {/* new old */}
            {(canAssign() || currentUser?.role === "team") && (
              <div className="details-block">
                <h3>Teammates</h3>
                <div
                  className={`custom-select ${dropdownOpen ? "open" : "admin"}`}
                  onClick={() => canAssign() && setDropdownOpen(!dropdownOpen)}
                >
                  <div className="selected-option">
                    {selectedChat.assignedTo ? (
                      <>
                        <img
                          className="avatar-sm"
                          src={getAvatar(selectedChat.assignedTo)}
                          alt={selectedChat.assignedTo?.name || "team"}
                        />{" "}
                        &nbsp;
                        {selectedChat.assignedTo?.name || "Selected Member"}
                      </>
                    ) : (
                      <span>Select Teammate</span>
                    )}
                  </div>

                  {canAssign() && dropdownOpen && (
                    <div
                      className="options-list"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {teammatesToShow.length > 0 ? (
                        teammatesToShow.map((member) => (
                          <div
                            key={member._id}
                            className="option-item"
                            onClick={() => selectAssignee(member)}
                          >
                            <img
                              className="avatar-sm"
                              src={getAvatar(member)}
                              alt={getMemberFullName(member)}
                            />{" "}
                            &nbsp;
                            {getMemberFullName(member)}
                          </div>
                        ))
                      ) : (
                        <div className="option-item">No teammates found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Popups */}
            {showAssignPopup && (
              <div className="popup">
                <p>Assign {pendingAssignee?.name} to chat?</p>
                <button onClick={() => setShowAssignPopup(false)}>
                  Cancel
                </button>
                <button onClick={confirmAssign}>Confirm</button>
              </div>
            )}

            {showReassignPopup && (
              <div className="popup">
                <p>Chat would be assigned to Different team member</p>
                <button onClick={() => setShowReassignPopup(false)}>
                  Cancel
                </button>
                <button onClick={confirmReassign}>Confirm</button>
              </div>
            )}

            {/* Ticket Status */}
            {canChangeStatus() && (
              <div className="details-block">
                <h3>Ticket Status</h3>
                <select
                  className="ticket-select"
                  value={ticketStatus || selectedChat.status}
                  onChange={handleStatusChange}
                >
                  {/* <option value="">Ticket Status</option> */}
                  <option value="">🎫Ticket Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>

                <div className="status-buttons">
                  <button
                    className={`status-btn ${
                      selectedChat.status === "resolved" ? "active" : ""
                    }`}
                    onClick={() => setShowResolveConfirmPopup(true)}
                  >
                    Resolved
                  </button>
                  <button
                    className={`status-btn ${
                      selectedChat.status !== "resolved" ? "active" : ""
                    }`}
                    onClick={() => setShowUnresolveConfirmPopup(true)}
                  >
                    Unresolved
                  </button>
                </div>

                {showResolveConfirmPopup && (
                  <div className="popup">
                    <p>Chat will be closed</p>
                    <button onClick={() => setShowResolveConfirmPopup(false)}>
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        confirmResolve();
                        setShowResolveConfirmPopup(false);
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                )}

                {showUnresolveConfirmPopup && (
                  <div className="popup">
                    <p>Chat will be marked as unresolved. Are you sure?</p>
                    <button onClick={() => setShowUnresolveConfirmPopup(false)}>
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        markUnresolved();
                        setShowUnresolveConfirmPopup(false);
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            )}

            {showClosePopup && (
              <div className="popup">
                <p>Chat will be closed</p>
                <button onClick={() => setShowClosePopup(false)}>Cancel</button>
                <button onClick={confirmClose}>Confirm</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessagePage;