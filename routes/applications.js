import { Router } from "express";
import { ObjectId } from "mongodb";
import { applications, tuitions } from "../db.js";
import { verifyToken, verifyStudent, verifyTutor } from "../middleware/auth.js";
const router = Router();
const PHONE_REGEX = /^(\+?88)?01[3-9]\d{8}$/;
router.get("/status/:tuitionId", verifyToken, verifyStudent, async (req, res) => {
  try {
    const found = await applications().findOne({
      tuitionId: req.params.tuitionId,
      studentEmail: req.user.email
    });
    res.json({
      applied: Boolean(found)
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not check application status"
    });
  }
});
router.post("/", verifyToken, verifyStudent, async (req, res) => {
  try {
    const {
      tuitionId,
      phone = "",
      preferredSchedule = "",
      studentNote = ""
    } = req.body;
    if (!ObjectId.isValid(tuitionId)) return res.status(400).json({
      message: "Invalid tuition id"
    });
    if (!PHONE_REGEX.test(phone.trim())) return res.status(400).json({
      message: "Enter a valid phone number"
    });
    if (preferredSchedule.trim().length < 3) return res.status(400).json({
      message: "Preferred schedule is required"
    });
    const tuition = await tuitions().findOne({
      _id: new ObjectId(tuitionId),
      approvalStatus: "approved",
      isActive: true
    });
    if (!tuition) return res.status(404).json({
      message: "This tuition is not available"
    });
    const exists = await applications().findOne({
      tuitionId,
      studentEmail: req.user.email
    });
    if (exists) return res.status(409).json({
      message: "You have already applied to this tuition"
    });
    const doc = {
      tuitionId,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorEmail: tuition.tutorEmail,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentPhone: phone.trim(),
      preferredSchedule: preferredSchedule.trim(),
      studentNote: studentNote.trim().slice(0, 500),
      status: "pending",
      appliedAt: new Date()
    };
    const result = await applications().insertOne(doc);
    res.status(201).json({
      message: "Application submitted",
      id: result.insertedId
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({
      message: "You have already applied to this tuition"
    });
    console.error(err);
    res.status(500).json({
      message: "Failed to submit application"
    });
  }
});
router.get("/my", verifyToken, verifyStudent, async (req, res) => {
  try {
    const list = await applications().find({
      studentEmail: req.user.email
    }).sort({
      appliedAt: -1
    }).toArray();
    const ids = list.map(a => a.tuitionId).filter(ObjectId.isValid).map(id => new ObjectId(id));
    const related = await tuitions().find({
      _id: {
        $in: ids
      }
    }, {
      projection: {
        tutorName: 1
      }
    }).toArray();
    const nameById = Object.fromEntries(related.map(t => [String(t._id), t.tutorName]));
    res.json(list.map(a => ({
      ...a,
      tutorName: nameById[a.tuitionId] || a.tutorEmail
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to load applications"
    });
  }
});
router.delete("/:id", verifyToken, verifyStudent, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({
      message: "Invalid application id"
    });
    const result = await applications().deleteOne({
      _id: new ObjectId(req.params.id),
      studentEmail: req.user.email,
      status: "pending"
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Only your own pending applications can be cancelled"
      });
    }
    res.json({
      message: "Application cancelled"
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to cancel application"
    });
  }
});
router.get("/received", verifyToken, verifyTutor, async (req, res) => {
  try {
    const list = await applications().find({
      tutorEmail: req.user.email
    }).sort({
      appliedAt: -1
    }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load applicants"
    });
  }
});
router.patch("/:id/status", verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      status
    } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be accepted or rejected"
      });
    }
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({
      message: "Invalid application id"
    });
    const result = await applications().updateOne({
      _id: new ObjectId(req.params.id),
      tutorEmail: req.user.email
    }, {
      $set: {
        status
      }
    });
    if (!result.matchedCount) return res.status(404).json({
      message: "Application not found"
    });
    res.json({
      message: `Application ${status}`
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update application"
    });
  }
});
export default router;
