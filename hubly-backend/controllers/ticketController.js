
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Create Ticket
exports.createTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      user: req.user._id, // store who created ticket
    });

    res.status(201).json({ message: "Ticket Created", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user assignedTo")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Message to Ticket (Only Allowed Users)
exports.addMessageToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "Message text required" });

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Permission Check: Only the user + assigned member can chat
    const isUser = ticket.user.toString() === req.user._id.toString();
    const isAssignedMember =
      ticket.assignedTo?.toString() === req.user._id.toString();

    if (!isUser && !isAssignedMember) {
      return res.status(403).json({
        message: "You are not allowed to send message on this ticket",
      });
    }

    // Add Message
    ticket.messages.push({
      text,
      sender: req.user._id, // Fixed ObjectId push
      timestamp: new Date(),
    });

    //  Prevent changing assigned user again
if (!req.body.noAssign) {
  ticket.assignedTo = ticket.assignedTo || req.user._id; 
}

    await ticket.save();

    // Populate again so frontend gets details
    const updatedTicket = await Ticket.findById(ticketId).populate(
      "user assignedTo messages.sender"
    );

    res.status(200).json(updatedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign Ticket to Team Member
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { teamMemberId } = req.body;

    const ticket = await Ticket.findById(ticketId).populate("assignedTo");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const member = await User.findById(teamMemberId);
    if (!member || member.role !== "team") {
      return res.status(400).json({ message: "Invalid team member" });
    }

    ticket.assignedTo = member._id;
    ticket.status = "assigned";
    await ticket.save();

    res.status(200).json({
      message: `Ticket assigned to ${member.name}`,
      assignedTo: member,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

