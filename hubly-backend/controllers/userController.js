

const User = require('../models/User');
const Ticket = require('../models/Ticket');
const bcrypt = require("bcryptjs");


exports.createTeamMember = async (req, res) => {
  try {
    const { name, email, phone, role = 'team', password, username } = req.body;

    //  Required fields check
    if (!name || !email || !password) 
      return res.status(400).json({ message: 'Missing fields' });

    //  Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) 
      return res.status(400).json({ message: 'Email already exists' });

    // Check if username already exists (optional)
    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) 
        return res.status(400).json({ message: 'Username already exists' });
    }

    //  Role validation (if using enum ["admin", "team"])
    const allowedRoles = ["admin", "team"];
    if (!allowedRoles.includes(role)) 
      return res.status(400).json({ message: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}` });

    //  Create new user
    const user = new User({ name, email, phone, role, password, username });
    await user.save();

    res.status(201).json({ 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, username: user.username } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
