import axios from "axios";

const API = axios.create({
  baseURL: "https://backend-ticketing-system-project.onrender.com/api",
});

// Attach token automatically if stored
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("hublyToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
