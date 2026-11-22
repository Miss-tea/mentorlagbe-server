import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Any logged-in user
router.get("/", verifyToken, (req, res) => {
  res.json({ message: "Token is valid ✅", user: req.user });
});

// Admins only (middlewares run left to right)
router.get("/admin-only", verifyToken, verifyAdmin, (req, res) => {
  res.json({ message: "Welcome, admin 👑" });
});

export default router;
