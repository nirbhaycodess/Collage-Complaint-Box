const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { requireAdmin } = require("../middleware/adminAuth");
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
  trackComplaint,
  getActiveComplaintByEmail,
} = require("../controllers/complaintcontroller");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Store uploaded images on disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/submit", upload.single("image"), createComplaint);

// public: track complaint status
router.get("/track/:id", trackComplaint);
// public: check active complaint by email
router.get("/active/:email", getActiveComplaintByEmail);

// fetch all complaints at /api/complaints
router.get("/", requireAdmin, getComplaints);


const setDefaultResolved = (req) => {
  if (!req.body) req.body = {};
  if (!req.body.status) req.body.status = "resolved";
};

// Preferred admin endpoint
router.patch("/:id/status", requireAdmin, updateComplaintStatus);
router.put("/:id/status", requireAdmin, updateComplaintStatus);

// Backwards compatibility with older frontend calls
router.patch("/:id", requireAdmin, (req, res) => {
  setDefaultResolved(req);
  return updateComplaintStatus(req, res);
});
router.put("/:id", requireAdmin, (req, res) => {
  setDefaultResolved(req);
  return updateComplaintStatus(req, res);
});


module.exports = router;
