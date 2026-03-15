const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

  type: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  image: {
    type: String
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

module.exports = mongoose.model("Complaint", complaintSchema);
