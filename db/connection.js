import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
// db/connection.js
export const connectDB = async () => {
    try {
        // Just pass the URI. Mongoose 6+ does the rest automatically.
        await mongoose.connect(process.env.MONGO_URI); 
        console.log("✅ MongoDB connected to servey database");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
};
