const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

  studentId: {
    type: String,
    required: true,
    trim: true
  },

  studentName: {
    type: String,
    required: true,
    trim: true
  },

  studentEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  type: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  image: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  complaintTime: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ["pending", "resolved", "done"],
    default: "pending"
  },

  submittedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("StudentComplaint", complaintSchema);
