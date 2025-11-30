const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true },
    name: { type: String, default: "Guest User" },
    email: { type: String, default: "Not shared" },
    phone: { type: String, default: "Not shared" },
    status: { type: String, default: "open" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messages: [
      {
        text: { type: String, required: true },
        sender: { type: String, required: true }, // 'user' or 'bot'
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "ticketId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.ticketId = "TCT" + String(counter.seq).padStart(7, "0");
  }
  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);
