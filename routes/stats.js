import { Router } from "express";
import { applications } from "../db.js";
import { verifyToken, verifyStudent } from "../middleware/auth.js";

const router = Router();

// GET /api/stats/student
router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    const email = req.user.email;
    const [total, accepted, pending] = await Promise.all([
      applications().countDocuments({ studentEmail: email }),
      applications().countDocuments({ studentEmail: email, status: "accepted" }),
      applications().countDocuments({ studentEmail: email, status: "pending" }),
    ]);
    res.json({ total, accepted, pending, plan: req.user.plan });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats" });
  }
});

export default router;
