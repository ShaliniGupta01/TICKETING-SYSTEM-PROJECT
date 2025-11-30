/* eslint-disable no-unused-vars */
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "remixicon/fonts/remixicon.css";
import "./DashboardPage.css";
import API from "../api/axios";

const BASE_URL = "https://backend-ticketing-system-project.onrender.com/api";

// Load avatar cache from local storage or initialize empty object
const avatarCache = JSON.parse(localStorage.getItem("ticketAvatars")) || {};

const DashboardPage = () => {
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All Tickets");
  const [loading, setLoading] = useState(true);

  // Fetch all tickets
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchTickets = async () => {
      try {
        const response = await API.get(`${BASE_URL}/tickets`);

        if (Array.isArray(response.data)) {
          setTickets(response.data);
        } else if (response.data?.tickets) {
          setTickets(response.data.tickets);
        }
      } catch (error) {
        console.error(
          "Error fetching tickets:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user, navigate]);

  const openTicketChat = (ticket) => {
    navigate(`/messages/${ticket._id}`, { state: { ticket } });
  };

 const filteredTickets = tickets.filter((ticket) => {
  const term = searchTerm.toLowerCase();
  const status = ticket.status?.toLowerCase();

  // If user types search keywords for status:
  if (term === "resolved") return status === "resolved";
  if (term === "unresolved") return status === "unresolved" || status === "open";
  if (term === "all tickets" || term === "") return true;

  // Otherwise search by ticketId
  return ticket.ticketId?.toLowerCase().includes(term);
  // return (`TCT${ticket.ticketId}`)?.toLowerCase().includes(term);

});

  if (!user) return null;

  // Avatar selection with memory persistence
  const getAvatar = (ticket) => {
    const ticketId = ticket._id;

    if (avatarCache[ticketId]) {
      return avatarCache[ticketId];
    }

    const name = ticket?.name || ticket?.user?.name || "";
    const isFemale = name.toLowerCase().endsWith("a");
    const randomIndex = Math.floor(Math.random() * 50);

    const avatarURL = isFemale
      ? `https://randomuser.me/api/portraits/women/${randomIndex}.jpg`
      : `https://randomuser.me/api/portraits/men/${randomIndex}.jpg`;

    avatarCache[ticketId] = avatarURL;
    localStorage.setItem("ticketAvatars", JSON.stringify(avatarCache));

    return avatarURL;
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-content">
          <h2 className="name-heading">Dashboard</h2>

          {/* Search */}
          <div className="search-input-wrapper">
            <i className="ri-search-line search-icon"></i>
            <input
              className="ticket-search-input"
              type="text"
              placeholder="Search for Ticket"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="ticket-filter-tabs">
            {["All Tickets", "Resolved", "Unresolved"].map((tab) => (
              <button
                key={tab}
                className={`filter-tab ${filter === tab ? "active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tickets List */}
          <div className="ticket-list">
            {loading ? (
              <p>Loading tickets...</p>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className={`ticket-card ${ticket.status}`}
                  onClick={() => openTicketChat(ticket)}
                >
                  {/* Ticket Header */}
              

                  <div className="ticket-header">
  <span className="ticket-number">
    {/* Ticket# {ticket.ticketId ?? ticket._id} */}
    Ticket# TCT{ticket.ticketId ?? ticket._id}

  </span>

  <div className="ticket-meta">
    <span className="ticket-time">
      Posted at{" "}
      {new Date(ticket.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>

    <span className={`ticket-status ${ticket.status}`}>
      {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
    </span>
  </div>
</div>
                  {/* Latest Message Preview */}
                  <p className="ticket-message">
                    {ticket.messages?.length > 0
                      ? ticket.messages[ticket.messages.length - 1]?.text
                      : "No message yet"}
                  </p>

                  {/* Ticket User Info */}
                  <div className="ticket-user">
                    <img
                      src={getAvatar(ticket)}
                      alt="avatar"
                      className="ticket-avatar"
                    />
                    <div>
                      <p>{ticket.name || ticket.user?.name || "Unknown User"}</p>
                      <small>
                        <p>{ticket.phone || ticket.user?.phone || ""}</p>
                        <p>{ticket.email || ticket.user?.email || ""}</p>
                      </small>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No tickets found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
