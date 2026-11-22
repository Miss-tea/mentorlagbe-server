import "dotenv/config"; // must be the first import
import express from "express";
import cors from "cors";
import { connectDB, tuitions } from "./db.js";

const app = express();

// Middleware = functions that run on every request, in order
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json()); // lets us read JSON sent in request bodies

// A "route": when someone visits GET /, run this function
app.get("/", (req, res) => {
  res.send("MentorLagbe API is running 🚀");
});

app.get("/api/tuitions", async (req, res) => {
  const list = await tuitions()
    .find({ approvalStatus: "approved", isActive: true })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(list);
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(port, () => console.log(`Server on port ${port}`)))
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
