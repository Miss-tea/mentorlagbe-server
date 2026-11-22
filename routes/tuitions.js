import { Router } from "express";
import { ObjectId } from "mongodb";
import { tuitions } from "../db.js";

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

export default router;
