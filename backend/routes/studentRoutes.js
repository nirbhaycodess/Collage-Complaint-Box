const express = require("express");
const multer = require("multer");
const {
  verifyStudentId,
  getVerificationStatus,
} = require("../controllers/studentController");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/verify", upload.single("idCard"), verifyStudentId);
router.get("/verify/status", getVerificationStatus);

module.exports = router;
