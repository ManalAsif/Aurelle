const mongoose = require("mongoose");

// Works with a local MongoDB or a MongoDB Atlas cluster — only MONGO_URI changes.
// Atlas format: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aurelle?retryWrites=true&w=majority
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Copy backend/.env.example to backend/.env and fill it in.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || undefined,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
