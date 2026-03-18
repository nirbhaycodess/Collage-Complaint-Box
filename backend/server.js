const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const connectDB = require("./config/db");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

connectDB();

// Log every incoming request (useful for dev)
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", schemaVersion: "v2" });
});

app.get("/", (req, res) => {
  res.send("College Complaint Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
