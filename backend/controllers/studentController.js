const Tesseract = require("tesseract.js");
const StudentVerification = require("../models/studentVerification");

const UNIVERSITY_NAME =
  process.env.UNIVERSITY_NAME || "Invertis University";
const UNIVERSITY_FALLBACK =
  process.env.UNIVERSITY_FALLBACK || "Invertis";

const normalize = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCompact = (value) =>
  normalize(value).replace(/[^a-z0-9]/g, "");

const hasPartialChunkMatch = (expected, ocrText, minChunkLength) => {
  const source = normalizeCompact(expected);
  const target = normalizeCompact(ocrText);

  if (!source || !target) return false;

  // Fallback for very short inputs
  if (source.length < minChunkLength || target.length < minChunkLength) {
    return source.includes(target) || target.includes(source);
  }

  for (let index = 0; index <= source.length - minChunkLength; index += 1) {
    const chunk = source.slice(index, index + minChunkLength);
    if (target.includes(chunk)) {
      return true;
    }
  }

  return false;
};

const getNameTokens = (fullName) =>
  normalize(fullName)
    .split(" ")
    .filter((token) => token.length >= 3);

const extractNameMatches = (fullName, ocrText) => {
  const minNameChunkLength = Number(process.env.OCR_MIN_NAME_CHARS) || 3;
  const tokens = getNameTokens(fullName);
  const matchedTokens = tokens.filter((token) =>
    hasPartialChunkMatch(token, ocrText, minNameChunkLength)
  );
  return {
    totalTokens: tokens.length,
    matchedTokens: matchedTokens.length,
    tokens,
  };
};

const runOcr = async (buffer) => {
  const result = await Tesseract.recognize(buffer, "eng");
  return result?.data?.text || "";
};

const verifyStudentId = async (req, res) => {
  try {
    const { studentEmail, studentName } = req.body || {};
    const studentNameInput = String(studentName || "").trim();

    if (!studentEmail || !studentNameInput) {
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
    const minUniversityChunkLength =
      Number(process.env.OCR_MIN_UNIVERSITY_CHARS) || 4;
    const hasUniversity =
      hasPartialChunkMatch(
        UNIVERSITY_NAME,
        ocrText,
        minUniversityChunkLength
      ) ||
      hasPartialChunkMatch(
        UNIVERSITY_FALLBACK,
        ocrText,
        minUniversityChunkLength
      );
    const nameMatch = extractNameMatches(studentNameInput, ocrText);
    const requiredNameMatches = 1;
    const hasName = nameMatch.matchedTokens >= requiredNameMatches;

    const verified = Boolean(hasUniversity && hasName);
    const record = await StudentVerification.findOneAndUpdate(
      { studentEmail: studentEmail.toLowerCase() },
      {
        $set: {
          studentEmail: studentEmail.toLowerCase(),
          studentName: studentNameInput,
          verified,
          verificationStatus: verified ? "yes" : "no",
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
        nameMatchedTokens: nameMatch.matchedTokens,
        nameRequiredTokens: requiredNameMatches,
      },
      data: {
        studentEmail: record?.studentEmail || studentEmail.toLowerCase(),
        studentName: record?.studentName || studentNameInput,
        verified: record?.verified || false,
        verificationStatus: record?.verificationStatus || "no",
        verifiedAt: record?.verifiedAt || null,
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
    }).select("studentEmail studentName verified verificationStatus verifiedAt");

    return res.status(200).json({
      verified: Boolean(record?.verified),
      verificationStatus: record?.verificationStatus || "no",
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
