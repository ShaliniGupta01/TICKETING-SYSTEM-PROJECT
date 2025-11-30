
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  //  passwords: { type: [String], default: [] }, // array of hashed passwords
  role: { type: String, enum: ["admin", "team"], default: "team" },
  username: { type: String, unique: true, sparse: true } // make it sparse
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
// , required: true

