import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import apiRoutes from "./routes/ads.routes";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 9000;

// Mount the API routes
app.use("/api", apiRoutes); // <-- Use routes

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await connectDatabase();
});