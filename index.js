import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import tuitionRoutes from "./routes/tuitions.js";
import meRoutes from "./routes/me.js";
import applicationRoutes from "./routes/applications.js";
import statsRoutes from "./routes/stats.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import paymentRoutes, { stripeWebhook } from "./routes/payments.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Connect to MongoDB once, then reuse that connection for every request.
// (Serverless functions can start cold, so we cannot connect only at boot.)
let dbReady;
app.use(async (req, res, next) => {
  try {
    dbReady ??= connectDB();
    await dbReady;
    next();
  } catch (err) {
    dbReady = undefined; // allow a retry on the next request
    console.error("DB connection failed:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Stripe needs the RAW body, so this comes BEFORE express.json()
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
app.use("/api/upload", uploadRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/payments", paymentRoutes);

// Clean JSON 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Last-resort error handler, so the server never shows an HTML error page
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

export default app; // Vercel uses this export

// On your own computer there is no Vercel, so start a normal server
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  dbReady = connectDB();
  dbReady
    .then(() => app.listen(port, () => console.log(`Server on port ${port}`)))
    .catch((err) => {
      console.error("DB connection failed:", err);
      process.exit(1);
    });
}
