import { Router } from "express";
import { applications, tuitions } from "../db.js";
import { verifyToken, verifyStudent, verifyTutor } from "../middleware/auth.js";
const router = Router();
router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    const email = req.user.email;
    const [total, accepted, pending] = await Promise.all([applications().countDocuments({
      studentEmail: email
    }), applications().countDocuments({
      studentEmail: email,
      status: "accepted"
    }), applications().countDocuments({
      studentEmail: email,
      status: "pending"
    })]);
    res.json({
      total,
      accepted,
      pending,
      plan: req.user.plan
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to load stats"
    });
  }
});
router.get("/tutor", verifyToken, verifyTutor, async (req, res) => {
  try {
    const email = req.user.email;
    const [total, active, applicants] = await Promise.all([tuitions().countDocuments({
      tutorEmail: email
    }), tuitions().countDocuments({
      tutorEmail: email,
      approvalStatus: "approved",
      isActive: true
    }), applications().countDocuments({
      tutorEmail: email
    })]);
    res.json({
      total,
      active,
      applicants,
      plan: req.user.plan
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to load stats"
    });
  }
});
export default router;
