const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Prefer env var, fall back to local dev DB
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/college_complaint_box";

    await mongoose.connect(mongoUri);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exitCode = 1;
  }
};

module.exports = connectDB;
