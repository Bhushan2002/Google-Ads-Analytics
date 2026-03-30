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
        await mongoose.connect(url);
        console.log("✅ Database Connected");
    } catch (e: any) {
        console.error("❌ Database Connection Failed:", e.message || e);
    }
}