const Complaint = require("../models/complaint");
const mongoose = require("mongoose");
const StudentVerification = require("../models/studentVerification");
const { uploadComplaintImage } = require("../config/cloudinary");

const ALLOWED_STATUSES = new Set(["pending", "resolved", "done"]);

/* Create Complaint */
const createComplaint = async (req, res) => {

  try {
    // Validate required fields
    const body = req.body || {};
    const {
      studentId,
      studentName,
      studentEmail,
      type,
      description,
      location,
    } = body;

    if (
      !studentId ||
      !studentName ||
      !studentEmail ||
      !type ||
      !description ||
      !location
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        error:
          "studentId, studentName, studentEmail, type, description, and location are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Missing required file",
        error: "image is required",
      });
    }

    const existingActive = await Complaint.findOne({
      studentEmail: studentEmail.toLowerCase(),
      status: { $ne: "resolved" },
    }).select("_id status submittedAt type description complaintTime");
    if (existingActive) {
      return res.status(409).json({
        message:
          "You already have an active complaint. Please wait until it is resolved.",
        data: existingActive,
      });
    }

    const verified = await StudentVerification.findOne({
      studentEmail: studentEmail.toLowerCase(),
      verified: true,
    }).select("_id verified");

    if (!verified) {
      return res.status(403).json({
        message:
          "Student verification required. Please upload your ID card and verify before submitting a complaint.",
      });
    }

    let uploadResult;
    try {
      uploadResult = await uploadComplaintImage(req.file);
    } catch (uploadError) {
      return res.status(500).json({
        message: "Image upload failed",
        error: uploadError?.message ?? String(uploadError),
      });
    }

    const complaint = new Complaint({

      studentId,
      studentName,
      studentEmail: studentEmail.toLowerCase(),
      type,
      description,
      location,
      complaintTime: new Date(),
      image: uploadResult.secure_url

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

/* Public: Check Active Complaint By Email */
const getActiveComplaintByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const active = await Complaint.findOne({
      studentEmail: email.toLowerCase(),
      status: { $ne: "resolved" },
    }).select("_id status submittedAt type description complaintTime");

    return res.status(200).json({
      message: active ? "Active complaint found" : "No active complaint",
      data: active || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error checking active complaint",
      error: error?.message ?? String(error),
    });
  }
};

/* Get Complaints */
const getComplaints = async (req, res) => {
  try {
    // Admin-only: list all complaints
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
    // Validate id + status, then update
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
  getActiveComplaintByEmail,
};
