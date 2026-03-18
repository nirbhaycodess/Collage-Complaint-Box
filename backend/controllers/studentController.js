const Tesseract = require("tesseract.js");
const StudentVerification = require("../models/studentVerification");

const UNIVERSITY_NAME =
  process.env.UNIVERSITY_NAME || "Invertians University";

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const extractNameMatches = (fullName, ocrText) => {
  const tokens = normalize(fullName)
    .split(" ")
    .filter((token) => token.length >= 3);
  const haystack = normalize(ocrText);
  return tokens.some((token) => haystack.includes(token));
};

const runOcr = async (buffer) => {
  const result = await Tesseract.recognize(buffer, "eng");
  return result?.data?.text || "";
};

const verifyStudentId = async (req, res) => {
  try {
    const { studentEmail, studentName } = req.body || {};

    if (!studentEmail || !studentName) {
      return res.status(400).json({
        message: "Missing required fields",
        error: "studentEmail and studentName are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Missing required file",
        error: "idCard is required",
      });
    }

    const ocrText = await runOcr(req.file.buffer);
    const hasUniversity = normalize(ocrText).includes(
      normalize(UNIVERSITY_NAME)
    );
    const hasName = extractNameMatches(studentName, ocrText);

    const verified = Boolean(hasUniversity && hasName);

    const record = await StudentVerification.findOneAndUpdate(
      { studentEmail: studentEmail.toLowerCase() },
      {
        $set: {
          studentEmail: studentEmail.toLowerCase(),
          studentName,
          verified,
          ocrText,
          verifiedAt: verified ? new Date() : null,
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: verified
        ? "Student verified successfully"
        : "Verification failed. Please upload a clearer ID card.",
      verified,
      checks: {
        university: hasUniversity,
        name: hasName,
      },
      data: {
        studentEmail: record.studentEmail,
        studentName: record.studentName,
        verified: record.verified,
        verifiedAt: record.verifiedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error verifying student",
      error: error?.message ?? String(error),
    });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "email is required" });
    }

    const record = await StudentVerification.findOne({
      studentEmail: email.toLowerCase(),
    }).select("studentEmail studentName verified verifiedAt");

    return res.status(200).json({
      verified: Boolean(record?.verified),
      data: record || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error checking verification status",
      error: error?.message ?? String(error),
    });
  }
};

module.exports = {
  verifyStudentId,
  getVerificationStatus,
};
