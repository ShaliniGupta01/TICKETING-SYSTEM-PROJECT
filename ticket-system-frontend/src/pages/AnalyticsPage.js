/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import MissedChatsChart from "../components/MissedChatsChart";
import API from "../api/axios";
import "./AnalyticsPage.css";

const AnalyticsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [missedChatsData, setMissedChatsData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [resolvedTicketsPercentage, setResolvedTicketsPercentage] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const [avgReplyTime, setAvgReplyTime] = useState(0);

  // Week Number Generator
  const getWeekNumber = (date) => {
    if (!date) return 1;
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("hublyToken");
        const response = await API.get("/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ticketsData = response.data;
        setTickets(ticketsData);
        setTotalChats(ticketsData.length);

        const maxWeeks = 10;
        const weeklyMissed = Array(maxWeeks).fill(0);
        const diffTimes = [];

        ticketsData.forEach((ticket) => {
          const msgs = ticket?.messages || [];
          if (!msgs.length) return;

          const week = getWeekNumber(ticket.createdAt) - 1;
          const weekIndex = Math.min(week, maxWeeks - 1);

          msgs.forEach((msg, i) => {
            if (msg.sender === "user") {
              const reply = msgs.slice(i + 1).find(
                (m) =>
                  m.sender === "team" ||
                  m.sender === "admin" ||
                  (typeof m.sender === "object" &&
                    ["team", "admin"].includes(m.sender.role))
              );

              // Missed chat count
              if (!reply) {
                weeklyMissed[weekIndex] += 1;
              }

              // Reply time tracking
              if (reply) {
                const diffInSec =
                  (new Date(reply.timestamp) - new Date(msg.timestamp)) / 1000;
                if (diffInSec > 0) diffTimes.push(diffInSec);
              }
            }
          });
        });

        setMissedChatsData(weeklyMissed);

        setChartLabels(
          Array.from({ length: maxWeeks }, (_, i) => `Week ${i + 1}`)
        );

        const averageReply = diffTimes.length
          ? Math.floor(
              diffTimes.reduce((a, b) => a + b, 0) / diffTimes.length
            )
          : 0;
        setAvgReplyTime(averageReply);

        const resolved = ticketsData.filter(
          (t) => t?.status === "resolved"
        ).length;

        setResolvedTicketsPercentage(
          ticketsData.length
            ? Math.round((resolved / ticketsData.length) * 100)
            : 0
        );
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    fetchData();
  }, []);

  const formatTime = (sec) => {
    return `${Math.floor(sec)} sec`;
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <h1>Analytics</h1>

        {/* Missed Chats Graph */}
        <div className="card missed-chats">
          <h2>Missed Chats</h2>
          <MissedChatsChart data={missedChatsData} labels={chartLabels} />
        </div>

        {/* Average Reply Time */}
        <div className="card metric-row">
          <div>
            <h2 className="green-text">Average Reply Time</h2>
            <p>
              For highest customer satisfaction rates you should aim to reply to
              an incoming customer's message in 15 seconds or less. Quick
              responses will get you more conversations, help you earn customers
              trust and make more sales.
            </p>
          </div>
          <span className="metric-value green-text">
            {formatTime(avgReplyTime)}
          </span>
        </div>

        {/* Resolved Tickets */}
        <div className="card metric-row resolved-tickets">
          <div>
            <h2 className="green-text">Resolved Tickets</h2>
            <p>
              A callback system on a website, as well as proactive invitations,
              help to attract even more customers. A separate round button for
              ordering a call with a small animation helps motivate customers.
            </p>
          </div>

          <div
            className="progress-circle-container"
            style={{ "--progress-value": resolvedTicketsPercentage }}
          >
            <span className="progress-text">{resolvedTicketsPercentage}%</span>
          </div>
        </div>

        {/* Total Chats */}
        <div className="card metric-row">
          <div>
            <h2>Total Chats</h2>
            <p>
              This metric shows the total number of chats for all Channels for
              the selected period.
            </p>
          </div>
          <span className="metric-value green-text">{totalChats} Chats</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

