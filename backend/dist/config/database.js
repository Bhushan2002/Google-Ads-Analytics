"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.isDatabaseConnected = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const isDatabaseConnected = () => mongoose_1.default.connection.readyState === 1;
exports.isDatabaseConnected = isDatabaseConnected;
const connectDatabase = async () => {
    const url = process.env.MONGO_URL;
    if (!url) {
        console.error("MONGO_URL is not set in .env!");
        return;
    }
    try {
        await mongoose_1.default.connect(url, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("✅ Database Connected");
    }
    catch (e) {
        console.error("❌ Database Connection Failed:", e.message || e);
        console.error("   → Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access From Anywhere (0.0.0.0/0)");
        console.error("   → Server will keep running but DB-dependent features won't work.");
    }
};
exports.connectDatabase = connectDatabase;
