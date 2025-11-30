const Message = require("../models/Message");
const Ticket = require("../models/Ticket");

exports.addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const isOwner = ticket.user?.toString() === req.user._id.toString();
    const isAssigned =
      ticket.assignedTo?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // Permission logic: Block admin after assignment
    const canSendMessage = () => {
      if (["resolved", "closed"].includes(ticket.status)) return false;
      if (isOwner) return true; // Owner (customer) can always send
      if (ticket.assignedTo && isAssigned) return true; // Assigned member can send
      if (isAdmin && !ticket.assignedTo) return true;
      return false; // Block admin after assignment
    };

    if (!canSendMessage()) {
      return res
        .status(403)
        .json({ message: "Not authorized to send message" });
    }

    const newMsg = {
      text,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      timestamp: new Date(),
    };

    ticket.messages.push(newMsg);
    await ticket.save();

    await ticket.populate({
      path: "messages.sender",
      select: "name email role",
    });

    return res.status(201).json(ticket.messages[ticket.messages.length - 1]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMessagesForTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({ ticketId })
      .populate("messages.sender", "name email role")
      .populate("assignedTo", "name");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.json(ticket.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
