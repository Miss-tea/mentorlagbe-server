import { Router } from "express";
import { ObjectId } from "mongodb";
import { users, tuitions } from "../db.js";
import { verifyToken, verifyStudent } from "../middleware/auth.js";

const router = Router();
const FREE_LIMIT = 5;

// Every route here is for logged-in students only
router.use(verifyToken, verifyStudent);

const getIds = async (email) => {
  const me = await users().findOne({ email }, { projection: { bookmarks: 1 } });
  return me?.bookmarks || [];
};

// GET /api/bookmarks/ids → just the saved ids (the heart buttons use this)
router.get("/ids", async (req, res) => {
  try {
    res.json({ ids: await getIds(req.user.email) });
  } catch (err) {
    res.status(500).json({ message: "Failed to load bookmarks" });
  }
});

// GET /api/bookmarks → full tuition objects for the Saved Tuitions page
router.get("/", async (req, res) => {
  try {
    const ids = await getIds(req.user.email);
    const objectIds = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
    const docs = await tuitions().find({ _id: { $in: objectIds } }).toArray();

    // Clean up ids of tuitions that were deleted since they were saved
    const existing = new Set(docs.map((d) => String(d._id)));
    if (existing.size !== ids.length) {
      await users().updateOne({ email: req.user.email }, { $set: { bookmarks: ids.filter((i) => existing.has(i)) } });
    }

    res.json({
      tuitions: docs.filter((d) => d.approvalStatus === "approved" && d.isActive),
      limit: req.user.plan === "pro" ? null : FREE_LIMIT,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load saved tuitions" });
  }
});

// POST /api/bookmarks/:tuitionId → save a tuition
router.post("/:tuitionId", async (req, res) => {
  try {
    const { tuitionId } = req.params;
    if (!ObjectId.isValid(tuitionId)) return res.status(400).json({ message: "Invalid tuition id" });

    const tuition = await tuitions().findOne(
      { _id: new ObjectId(tuitionId), approvalStatus: "approved", isActive: true },
      { projection: { _id: 1 } }
    );
    if (!tuition) return res.status(404).json({ message: "Tuition not found" });

    if ((await getIds(req.user.email)).includes(tuitionId)) return res.json({ message: "Already saved" });

    // The limit rule lives INSIDE the update filter, so it cannot be beaten by double clicks
    const filter = { email: req.user.email };
    if (req.user.plan !== "pro") {
      filter.$expr = { $lt: [{ $size: { $ifNull: ["$bookmarks", []] } }, FREE_LIMIT] };
    }

    const result = await users().updateOne(filter, { $addToSet: { bookmarks: tuitionId } });
    if (!result.matchedCount) {
      return res.status(403).json({ message: `Free plan allows ${FREE_LIMIT} saved tuitions. Upgrade to Pro for unlimited.` });
    }
    res.status(201).json({ message: "Saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save tuition" });
  }
});

// DELETE /api/bookmarks/:tuitionId → remove a saved tuition
router.delete("/:tuitionId", async (req, res) => {
  try {
    await users().updateOne({ email: req.user.email }, { $pull: { bookmarks: req.params.tuitionId } });
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove bookmark" });
  }
});

export default router;