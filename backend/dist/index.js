"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const ads_routes_1 = __importDefault(require("./routes/ads.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 9000;
// Mount the API routes
app.use("/api", ads_routes_1.default); // <-- Use routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await (0, database_1.connectDatabase)();
});
