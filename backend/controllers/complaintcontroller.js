const Complaint = require("../models/complaint");
const mongoose = require("mongoose");

const ALLOWED_STATUSES = new Set(["pending", "resolved", "done"]);

/* Create Complaint */
const createComplaint = async (req, res) => {

  try {

    const body = req.body || {};
    const { type, description } = body;

    if (!type || !description) {
      return res.status(400).json({
        message: "Missing required fields",
        error: "type and description are required",
      });
    }

    const complaint = new Complaint({

      type,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : null

    });

    const savedComplaint = await complaint.save();

    return res.status(201).json({
      message: "Complaint submitted successfully",
      data: savedComplaint
    });

  } catch (error) {

    return res.status(500).json({
      message: "Error submitting complaint",
      error: error.message
    });

  }

};

/* Get Complaints */
const getComplaints = async (req, res) => {
  try {
    const allComplaints = await Complaint.find({}).sort({ submittedAt: -1 });
    return res.status(200).json({
      message:
        allComplaints.length === 0
          ? "No complaints found in the database."
          : "Complaints fetched successfully",
      data: allComplaints,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching all data",
      error: error.message
    });
  }
};

/* Update Complaint Status (Admin) */

const updateComplaintStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const statusRaw = req.body?.status;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid complaint id" });
    }

    if (typeof statusRaw !== "string" || statusRaw.trim() === "") {
      return res.status(400).json({
        message: "Missing required field",
        error: "status is required",
      });
    }

    const status = statusRaw.trim().toLowerCase();
    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        allowed: Array.from(ALLOWED_STATUSES),
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    return res.status(200).json({
      message: "Complaint status updated successfully",
      data: complaint
    });

  } catch (error) {

    return res.status(500).json({
      message: "Error updating complaint",
      error: error.message
    });

  }
};

/* Public: Track Complaint Status */
const trackComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid complaint id" });
    }

    const complaint = await Complaint.findById(id).select(
      "_id type status submittedAt"
    );

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.status(200).json({
      message: "Complaint status fetched successfully",
      data: complaint,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error tracking complaint",
      error: error?.message ?? String(error),
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
  trackComplaint,
};
