import { Router } from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  }
});
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
router.post("/", verifyToken, (req, res) => {
  upload.single("image")(req, res, async err => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 4 MB" : "Invalid upload";
      return res.status(400).json({
        message
      });
    }
    if (!req.file) return res.status(400).json({
      message: "No image was sent"
    });
    if (!ALLOWED.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Only JPG, PNG, WEBP or GIF images are allowed"
      });
    }
    try {
      const form = new FormData();
      form.append("image", req.file.buffer.toString("base64"));
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
        method: "POST",
        body: form
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        console.error("ImgBB error:", json?.error?.message || response.status);
        return res.status(502).json({
          message: "Image hosting failed. Please try again."
        });
      }
      res.json({
        url: json.data.url
      });
    } catch (e) {
      console.error("Upload error:", e.message);
      res.status(500).json({
        message: "Upload failed"
      });
    }
  });
});
export default router;
