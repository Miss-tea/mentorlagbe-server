import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import tuitionRoutes from "./routes/tuitions.js";
import meRoutes from "./routes/me.js";
import applicationRoutes from "./routes/applications.js";
import statsRoutes from "./routes/stats.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes, { stripeWebhook } from "./routes/payments.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Stripe needs the RAW body to check the signature, so this comes BEFORE express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("MentorLagbe API is running 🚀");
});

app.use("/api/tuitions", tuitionRoutes);
app.use("/api/me", meRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

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
