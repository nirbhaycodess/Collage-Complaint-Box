const jwt = require("jsonwebtoken");

const requireAdmin = (req, res, next) => {
  // Expect Authorization: Bearer <token>
  const authHeader = req.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Missing Authorization token" });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const payload = jwt.verify(token, secret);
    if (payload?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error?.message ?? String(error),
    });
  }
};

module.exports = { requireAdmin };
