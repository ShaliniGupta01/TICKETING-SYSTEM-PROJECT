const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Ticket = require("../models/Ticket");
const mongoose = require("mongoose");

router.get("/", protect, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name _id") // Populate user as object
      .populate("assignedTo", "name _id") // Populate assignedTo as object
      .sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Assign Ticket → Team Member (Admin Only)

router.put("/assign/:ticketId", protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const { assignedTo } = req.body;
    ticket.assignedTo = assignedTo;

    // **New: Clear messages only on reassign (to make it stable like resolved)**
    if (req.body.isReassign) {
      ticket.messages = []; // Only clear on reassign
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("assignedTo", "name")
      .populate("user", "name");

    res.json({ ticket: populatedTicket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📌 Update Ticket Status

// Option 2: change backend route
router.put("/:ticketId/status", protect, async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;

  const ticket = await Ticket.findOneAndUpdate(
    { ticketId },
    { status, updatedAt: Date.now() },
    { new: true }
  );

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  res.json(ticket);
});

// POST /tickets → Create a new ticket
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, text } = req.body;

    if (!text) return res.status(400).json({ message: "Message is required" });

    // Generate a simple unique ticketId
    const ticketId = Math.random().toString(36).substring(2, 10);

    const newTicket = await Ticket.create({
      ticketId,
      name: name || "Guest User",
      email: email || "Not shared",
      phone: phone || "Not shared",
      messages: [{ sender: "user", text }],
      status: "open",
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticketId: newTicket.ticketId,
    });
  } catch (err) {
    console.error("Ticket creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
