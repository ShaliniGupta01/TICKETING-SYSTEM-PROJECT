const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config({ quiet: true });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const userRoutes = require("./routes/users"); // <-- Add this
const messageRoutes = require("./routes/messages");

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes); // <-- Mount users
app.use("/api/messages", messageRoutes);

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error: ", err));

 app.get('/', (req, res) => {
  res.send("Ticketing system backend is working!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));
