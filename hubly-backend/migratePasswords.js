const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // adjust path

mongoose.connect("mongodb://localhost:27017/hubly", { useNewUrlParser: true, useUnifiedTopology: true });

async function migratePasswords() {
  const users = await User.find({}); // all users
  for (const user of users) {
    if (!user.passwords || user.passwords.length === 0) {
      // hash the existing single password field or default to email
      const passwordToHash = user.password || user.email;
      const hashed = await bcrypt.hash(passwordToHash, 10);
      user.passwords = [hashed];
      await user.save();
      console.log(`Migrated passwords for: ${user.email}`);
    }
  }
  console.log("Migration done");
  process.exit();
}

migratePasswords();
