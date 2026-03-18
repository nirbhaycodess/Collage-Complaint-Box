const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");

const connectDB = async () => {
  try {
    // Prefer env var, fall back to local dev DB
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing. Set it in backend/.env");
    }

    // Optional ping using the native MongoDB driver (Atlas-style snippet)
    const client = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    await client.close();

    // Main app connection via Mongoose
    await mongoose.connect(mongoUri);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exitCode = 1;
  }
};

module.exports = connectDB;
