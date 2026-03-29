import mongoose from "mongoose"
import { configDotenv } from "dotenv";
configDotenv();

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const connectDatabase = async () => {
    const url = process.env.MONGO_URL!;
    if (!url) {
        console.error("MONGO_URL is not set in .env!");
        return;
    }
    try {
        await mongoose.connect(url, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("✅ Database Connected");
    } catch (e: any) {
        console.error("❌ Database Connection Failed:", e.message || e);
        console.error("   → Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access From Anywhere (0.0.0.0/0)");
        console.error("   → Server will keep running but DB-dependent features won't work.");
    }
}