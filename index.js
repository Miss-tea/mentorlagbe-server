import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import tuitionRoutes from "./routes/tuitions.js";
import meRoutes from "./routes/me.js";
import applicationRoutes from "./routes/applications.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MentorLagbe API is running 🚀");
});

// Every route inside tuitionRoutes gets the /api/tuitions prefix
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/me", meRoutes);
app.use("/api/applications", applicationRoutes);

// If no route matched, return a clean JSON 404 instead of an HTML page
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(port, () => console.log(`Server on port ${port}`)))
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
