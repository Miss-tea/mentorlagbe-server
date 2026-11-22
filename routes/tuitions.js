import { Router } from "express";
import { ObjectId } from "mongodb";
import { tuitions, users, applications } from "../db.js";
import { verifyToken, verifyTutor } from "../middleware/auth.js";
import { cleanTuition } from "../utils/validateTuition.js";

const router = Router();

// Users type text into the search box. Characters like ( or * have special
// meaning in regex, so we escape them to treat the input as plain text.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/tuitions?search=&subject=&classLevel=&mode=&sort=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const { search, subject, classLevel, mode, sort = "newest" } = req.query;

    // 1. Base filter: the public page must only ever show approved + active posts
    const filter = { approvalStatus: "approved", isActive: true };

    // 2. Add optional filters only when the user provided them
    if (search) {
      const regex = new RegExp(escapeRegex(String(search).trim()), "i"); // "i" = ignore case
      filter.$or = [{ title: regex }, { subject: regex }]; // match title OR subject
    }
    if (subject) filter.subject = String(subject);
    if (classLevel) filter.classLevel = String(classLevel);
    if (mode) filter.mode = String(mode);

    // 3. Pagination numbers (with safe limits so nobody asks for page -5 or 1,000,000 items)
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 50);

    // 4. Sorting options
    const sortOptions = {
      newest: { createdAt: -1 },
      "fee-low": { monthlyFee: 1 },
      "fee-high": { monthlyFee: -1 },
    };

    // 5. Run both queries at the same time (faster than one after another)
    const [items, total] = await Promise.all([
      tuitions()
        .find(filter)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      tuitions().countDocuments(filter),
    ]);

    res.json({ tuitions: items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load tuitions" });
  }
});

// GET /api/tuitions/filters/options → values for the filter dropdowns.
// IMPORTANT: this must stay ABOVE "/:id", or Express would treat "filters" as an id.
router.get("/filters/options", async (req, res) => {
  try {
    const base = { approvalStatus: "approved", isActive: true };
    const [subjects, classLevels] = await Promise.all([
      tuitions().distinct("subject", base),
      tuitions().distinct("classLevel", base),
    ]);
    res.json({ subjects: subjects.sort(), classLevels: classLevels.sort(), modes: ["Online", "Offline"] });
  } catch (err) {
    res.status(500).json({ message: "Failed to load filters" });
  }
});

// GET /api/tuitions/mine → every tuition of the logged-in tutor (any approval status)
router.get("/mine", verifyToken, verifyTutor, async (req, res) => {
  try {
    const list = await tuitions().find({ tutorEmail: req.user.email }).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to load your tuitions" });
  }
});

// GET /api/tuitions/:id → a single tuition for the details page
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tuition id" });
    }
    const tuition = await tuitions().findOne({
      _id: new ObjectId(id),
      approvalStatus: "approved",
      isActive: true,
    });
    if (!tuition) return res.status(404).json({ message: "Tuition not found" });
    res.json(tuition);
  } catch (err) {
    res.status(500).json({ message: "Failed to load tuition" });
  }
});

// POST /api/tuitions → a tutor posts a new tuition
router.post("/", verifyToken, verifyTutor, async (req, res) => {
  try {
    const { error, data } = cleanTuition(req.body);
    if (error) return res.status(400).json({ message: error });

    // Free tutors: max 2 posts. Pro tutors: unlimited.
    if (req.user.plan !== "pro") {
      const count = await tuitions().countDocuments({ tutorEmail: req.user.email });
      if (count >= 2) {
        return res.status(403).json({ message: "Free plan allows 2 tuition posts. Upgrade to Pro for unlimited posts." });
      }
    }

    const doc = {
      ...data,
      tutorName: req.user.name,    // from the verified token, never from the request body
      tutorEmail: req.user.email,
      approvalStatus: "pending",   // every new post waits for admin review
      isActive: true,
      createdAt: new Date(),
    };
    const result = await tuitions().insertOne(doc);
    res.status(201).json({ message: "Tuition submitted for admin approval", id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create tuition" });
  }
});

// PUT /api/tuitions/:id → edit your own tuition (goes back to pending for re-approval)
router.put("/:id", verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid tuition id" });

    const { error, data } = cleanTuition(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await tuitions().updateOne(
      { _id: new ObjectId(id), tutorEmail: req.user.email }, // ownership check
      { $set: { ...data, approvalStatus: "pending", updatedAt: new Date() } }
    );
    if (!result.matchedCount) return res.status(404).json({ message: "Tuition not found" });
    res.json({ message: "Tuition updated and sent for re-approval" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update tuition" });
  }
});

// PATCH /api/tuitions/:id/toggle → flip Active / Closed in one atomic step
router.patch("/:id/toggle", verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid tuition id" });

    const result = await tuitions().updateOne(
      { _id: new ObjectId(id), tutorEmail: req.user.email },
      [{ $set: { isActive: { $not: "$isActive" } } }] // an update pipeline
    );
    if (!result.matchedCount) return res.status(404).json({ message: "Tuition not found" });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// DELETE /api/tuitions/:id → delete your tuition and its applications
router.delete("/:id", verifyToken, verifyTutor, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid tuition id" });

    const result = await tuitions().deleteOne({ _id: new ObjectId(id), tutorEmail: req.user.email });
    if (!result.deletedCount) return res.status(404).json({ message: "Tuition not found" });

    await applications().deleteMany({ tuitionId: id }); // don't leave orphaned applications
    res.json({ message: "Tuition deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete tuition" });
  }
});

export default router;
