/* eslint-disable no-undef */
const config = {
  BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://backend-ticketing-system-project.onrender.com/api"
      : "http://localhost:5000/api", // local backend
};

// If user is logged in (admin/team), send token
// Ensure API exists (for example an axios instance) before attaching interceptors
if (typeof API !== "undefined" && API && API.interceptors) {
  API.interceptors.request.use((req) => {
    const token = localStorage.getItem("hublyToken");
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });
}

export default config;
