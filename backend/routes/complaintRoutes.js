const express = require("express");
const router = express.Router();
const multer = require("multer");

const { requireAdmin } = require("../middleware/adminAuth");
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
  trackComplaint,
  getActiveComplaintByEmail,
} = require("../controllers/complaintcontroller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file?.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image uploads are allowed"));
  },
});

router.post("/submit", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Invalid image upload",
        error: "Image must be 5 MB or smaller.",
      });
    }

    return res.status(400).json({
      message: "Invalid image upload",
      error: error?.message ?? String(error),
    });
  });
}, createComplaint);

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
