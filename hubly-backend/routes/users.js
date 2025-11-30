// routes/users.js
const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware"); // <-- destructure middleware functions
const User = require("../models/User");
const bcrypt = require("bcryptjs");
;

// -----------------------------------------
// GET LOGGED-IN USER PROFILE
// -----------------------------------------


router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, total: users.length, users });
  } catch (err) {
    console.error("Error in GET /:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




// POST /auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, username, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // 👇 Check how many users exist
    const count = await User.countDocuments();

    // 👇 First user = Admin | Others = Team
    const role = count === 0 ? "admin" : "team";

    const newUser = new User({
      fullName,
      email,
      password,
      role,
      username,
      phone
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Account Created!",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



// -----------------------------------------
// ADMIN → GET ALL USERS
// -----------------------------------------
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, total: users.length, users });
  } catch (err) {
    console.error("Error in GET /:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== UPDATE SELF ==================
// IMPORTANT: this route MUST BE ABOVE "/:id"
router.put("/me", protect, async (req, res) => {
  try {
    const { fullName, password } = req.body;

    if (!fullName)
      return res
        .status(400)
        .json({ success: false, message: "Full name required" });

    const updateData = { fullName };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ success: true, message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("PUT /me error:", err.message || err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// -----------------------------------------
// ADMIN → UPDATE A USER
// -----------------------------------------
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { fullName, email, role, username } = req.body;

    if (!fullName || !email || !role) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Full name, email, and role are required",
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, role, username },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in PUT /:id:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// -----------------------------------------
// ADMIN → DELETE A USER
// -----------------------------------------
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /:id:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
