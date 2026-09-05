const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    otpCode: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
