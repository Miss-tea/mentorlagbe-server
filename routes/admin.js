import { Router } from "express";
import { ObjectId } from "mongodb";
import { users, tuitions, payments } from "../db.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Every route in this file requires a valid token AND the admin role
router.use(verifyToken, verifyAdmin);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalTutors, pending, approved, revenue] = await Promise.all([
      users().countDocuments(),
      users().countDocuments({ role: "tutor" }),
      tuitions().countDocuments({ approvalStatus: "pending" }),
      tuitions().countDocuments({ approvalStatus: "approved" }),
      payments().aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
    ]);
    res.json({ totalUsers, totalTutors, pending, approved, revenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const list = await users()
      .find({}, { projection: { name: 1, email: 1, role: 1, plan: 1, image: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to load users" });
  }
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;
    if (!["student", "tutor", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid user id" });
    if (id === req.user.id) return res.status(400).json({ message: "You cannot change your own role" });

    const result = await users().updateOne({ _id: new ObjectId(id) }, { $set: { role } });
    if (!result.matchedCount) return res.status(404).json({ message: "User not found" });
    res.json({ message: `Role changed to ${role}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to change role" });
  }
});

// GET /api/admin/tuitions?status=pending|approved|rejected (no status = all)
router.get("/tuitions", async (req, res) => {
  try {
    const filter = ["pending", "approved", "rejected"].includes(req.query.status)
      ? { approvalStatus: req.query.status }
      : {};
    const list = await tuitions().find(filter).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to load tuitions" });
  }
});

// PATCH /api/admin/tuitions/:id/approval
router.patch("/tuitions/:id/approval", async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({ message: "approvalStatus must be approved or rejected" });
    }
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid tuition id" });

    const result = await tuitions().updateOne({ _id: new ObjectId(req.params.id) }, { $set: { approvalStatus } });
    if (!result.matchedCount) return res.status(404).json({ message: "Tuition not found" });
    res.json({ message: `Tuition ${approvalStatus}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update tuition" });
  }
});

// GET /api/admin/transactions
router.get("/transactions", async (req, res) => {
  try {
    res.json(await payments().find().sort({ paidAt: -1 }).toArray());
  } catch (err) {
    res.status(500).json({ message: "Failed to load transactions" });
  }
});

export default router;
