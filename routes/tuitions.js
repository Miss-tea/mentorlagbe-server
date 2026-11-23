import { Router } from "express";
import { ObjectId } from "mongodb";
import { tuitions, users, applications } from "../db.js";
import { verifyToken, verifyTutor } from "../middleware/auth.js";
import { cleanTuition } from "../utils/validateTuition.js";
const router = Router();
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
router.get("/", async (req, res) => {
  try {
    const {
      search,
      subject,
      classLevel,
      mode,
      sort = "newest"
    } = req.query;
    const filter = {
      approvalStatus: "approved",
      isActive: true
    };
    if (search) {
      const regex = new RegExp(escapeRegex(String(search).trim()), "i");
      filter.$or = [{
        title: regex
      }, {
        subject: regex
      }];
    }
    if (subject) filter.subject = String(subject);
    if (classLevel) filter.classLevel = String(classLevel);
    if (mode) filter.mode = String(mode);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 50);
    const sortOptions = {
      newest: {
        createdAt: -1
      },
      "fee-low": {
        monthlyFee: 1
      },
      "fee-high": {
        monthlyFee: -1
      }
    };
    const [items, total] = await Promise.all([tuitions().find(filter).sort(sortOptions[sort] || sortOptions.newest).skip((page - 1) * limit).limit(limit).toArray(), tuitions().countDocuments(filter)]);
    res.json({
      tuitions: items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to load tuitions"
    });
  }
});
router.get("/filters/options", async (req, res) => {
  try {
    const base = {
      approvalStatus: "approved",
      isActive: true
    };
    const [subjects, classLevels] = await Promise.all([tuitions().distinct("subject", base), tuitions().distinct("classLevel", base)]);
    res.json({
      subjects: subjects.sort(),
      classLevels: classLevels.sort(),
      modes: ["Online", "Offline"]
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to load filters"
    });
  }
});
router.get("/mine", verifyToken, verifyTutor, async (req, res) => {
  try {
    const list = await tuitions().find({
      tutorEmail: req.user.email
    }).sort({
      createdAt: -1
    }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load your tuitions"
    });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const {
      id
    } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid tuition id"
      });
    }
    const tuition = await tuitions().findOne({
      _id: new ObjectId(id),
      approvalStatus: "approved",
      isActive: true
    });
    if (!tuition) return res.status(404).json({
      message: "Tuition not found"
    });
    res.json(tuition);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load tuition"
    });
  }
});
router.post("/", verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      error,
      data
    } = cleanTuition(req.body);
    if (error) return res.status(400).json({
      message: error
    });
    if (req.user.plan !== "pro") {
      const count = await tuitions().countDocuments({
        tutorEmail: req.user.email
      });
      if (count >= 2) {
        return res.status(403).json({
          message: "Free plan allows 2 tuition posts. Upgrade to Pro for unlimited posts."
        });
      }
    }
    const doc = {
      ...data,
      tutorName: req.user.name,
      tutorEmail: req.user.email,
      approvalStatus: "pending",
      isActive: true,
      createdAt: new Date()
    };
    const result = await tuitions().insertOne(doc);
    res.status(201).json({
      message: "Tuition submitted for admin approval",
      id: result.insertedId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create tuition"
    });
  }
});
router.put("/:id", verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({
      message: "Invalid tuition id"
    });
    const {
      error,
      data
    } = cleanTuition(req.body);
    if (error) return res.status(400).json({
      message: error
    });
    const result = await tuitions().updateOne({
      _id: new ObjectId(id),
      tutorEmail: req.user.email
    }, {
      $set: {
        ...data,
        approvalStatus: "pending",
        updatedAt: new Date()
      }
    });
    if (!result.matchedCount) return res.status(404).json({
      message: "Tuition not found"
    });
    res.json({
      message: "Tuition updated and sent for re-approval"
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update tuition"
    });
  }
});
router.patch("/:id/toggle", verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({
      message: "Invalid tuition id"
    });
    const result = await tuitions().updateOne({
      _id: new ObjectId(id),
      tutorEmail: req.user.email
    }, [{
      $set: {
        isActive: {
          $not: "$isActive"
        }
      }
    }]);
    if (!result.matchedCount) return res.status(404).json({
      message: "Tuition not found"
    });
    res.json({
      message: "Status updated"
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update status"
    });
  }
});
router.delete("/:id", verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({
      message: "Invalid tuition id"
    });
    const result = await tuitions().deleteOne({
      _id: new ObjectId(id),
      tutorEmail: req.user.email
    });
    if (!result.deletedCount) return res.status(404).json({
      message: "Tuition not found"
    });
    await applications().deleteMany({
      tuitionId: id
    });
    res.json({
      message: "Tuition deleted"
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete tuition"
    });
  }
});
export default router;
