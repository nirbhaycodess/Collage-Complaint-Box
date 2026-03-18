const jwt = require("jsonwebtoken");

const loginAdmin = async (req, res) => {
  try {
    // Basic payload validation
    const adminId = req.body?.adminId;
    const password = req.body?.password;
    const accessCode = req.body?.accessCode;

    if (
      typeof adminId !== "string" ||
      typeof password !== "string" ||
      typeof accessCode !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid request body",
        error: "adminId, password, and accessCode are required",
      });
    }

    const expectedAdminId = process.env.ADMIN_ID ;
    const expectedPassword = process.env.ADMIN_PASSWORD ;        
    const expectedAccessCode = process.env.ADMIN_ACCESS_CODE ; 

    if (
      adminId !== expectedAdminId ||
      password !== expectedPassword ||
      accessCode !== expectedAccessCode
    ) {
      return res.status(401).json({
        message: "Invalid Admin ID, Password, or Access Code",
      });
    }

    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const expiresInSeconds = 60 * 60 * 12; // 12 hours

    // Issue admin JWT
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
