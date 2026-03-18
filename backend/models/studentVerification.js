const mongoose = require("mongoose");

const studentVerificationSchema = new mongoose.Schema(
  {
    studentEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    ocrText: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StudentVerification",
  studentVerificationSchema
);
