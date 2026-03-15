const jwt = require("jsonwebtoken");

const loginAdmin = async (req, res) => {
  try {
    const adminId = req.body?.adminId;
    const password = req.body?.password;

    if (typeof adminId !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Invalid request body",
        error: "adminId and password are required",
      });
    }

    const expectedAdminId = process.env.ADMIN_ID || "admin123";
    const expectedPassword = process.env.ADMIN_PASSWORD || "password123";

    if (adminId !== expectedAdminId || password !== expectedPassword) {
      return res.status(401).json({ message: "Invalid Admin ID or Password" });
    }

    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const expiresInSeconds = 60 * 60 * 12; // 12 hours

    const token = jwt.sign({ role: "admin", adminId }, secret, {
      expiresIn: expiresInSeconds,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      expiresInSeconds,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error during login",
      error: error?.message ?? String(error),
    });
  }
};

module.exports = { loginAdmin };

