import React from "react";
import { Line } from "react-chartjs-2";
import './MissedChatChart.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,  // Add Filler to the import
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler  // Add Filler to the register call
);

const MissedChatsChart = ({ data, labels }) => {
  const chartData = {
  labels: labels,
  datasets: [
    {
      label: "Chats",
      data: data,
      fill: true,
      backgroundColor: "rgba(76, 175, 80, 0.1)", // light green fill
      borderColor: "#4CAF50",
      tension: 0.4,
      pointBackgroundColor: "#4CAF50",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ],
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#333",
      titleColor: "#fff",
      bodyColor: "#fff",
      cornerRadius: 5,
      caretSize: 0,
      displayColors: false,
      callbacks: {
        label: (context) => `Chats ${context.raw}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#999", font: { size: 12 } },
    },
    y: {
      beginAtZero: true,
      max: 25,
      ticks: {
        stepSize: 5,
        callback: (v) => (v === 0 ? "" : v < 10 ? "0" + v : v),
        color: "#999",
      },
      grid: { color: "#eee" },
    },
  },
};


  return (
    <div className="missed-chat-chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MissedChatsChart;
