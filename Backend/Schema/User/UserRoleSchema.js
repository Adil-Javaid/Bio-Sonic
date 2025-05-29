const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  accessGranted: {
    type: Boolean,
    default: false,
  },
  signupDate: {
    type: Date,
    default: Date.now, // Automatically set the signup date
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
});

module.exports = mongoose.model("User", UserSchema);
