const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const Ticket = require("../models/Ticket");

// 📌 GET Messages + Ticket Info

// 📌 GET Messages + Ticket Info
router.get("/:ticketId", protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate("user", "name _id")
      .populate("assignedTo", "name _id");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const messages = await Message.find({ ticket: ticket._id })
      .populate("sender", "name _id role")
      .sort({ createdAt: 1 });

    res.json({ ticket, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📌 POST Message (User + Assigned Member + Admin)

router.post("/:ticketId", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Message is required" });

    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (["resolved", "closed"].includes(ticket.status)) {
      return res
        .status(400)
        .json({ message: "Cannot send messages on resolved/closed tickets" });
    }

    const isOwner =
      ticket.user &&
      (ticket.user._id
        ? ticket.user._id.toString()
        : ticket.user.toString()) === req.user._id.toString();

    const isAssigned =
      ticket.assignedTo &&
      (ticket.assignedTo._id
        ? ticket.assignedTo._id.toString()
        : ticket.assignedTo.toString()) === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({
        message:
          "Only assigned teammate, admin or ticket owner can send messages",
      });
    }

    // Create the message
    const message = await Message.create({
      ticket: ticket._id,
      sender: req.user._id, // the logged-in user (teammate or user)
      text,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email role avatar"
    );

    // Update ticket updatedAt
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("POST /messages error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
