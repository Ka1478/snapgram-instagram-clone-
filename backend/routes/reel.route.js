import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadReel } from "../middleware/upload.middleware.js";
import Reel from "../models/reel.model.js";
import cloudinary from "../config/cloudinary.js";
const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const reels = await Reel.find().populate("author", "username avatar fullName").sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, reels });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", uploadReel, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Video required" });
    const reel = await Reel.create({ author: req.user._id, video: req.file.path, videoPublicId: req.file.filename, caption: req.body.caption || "" });
    await reel.populate("author", "username avatar fullName");
    res.status(201).json({ success: true, reel });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/:id/like", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Not found" });
    const isLiked = reel.likes.includes(req.user._id);
    if (isLiked) reel.likes.pull(req.user._id); else reel.likes.push(req.user._id);
    await reel.save();
    res.json({ success: true, liked: !isLiked, likesCount: reel.likes.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/:id/comment", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text required" });
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Not found" });
    reel.comments.push({ user: req.user._id, text });
    await reel.save();
    await reel.populate("comments.user", "username avatar");
    res.status(201).json({ success: true, comment: reel.comments[reel.comments.length - 1] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Not found" });
    if (reel.author.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (reel.videoPublicId) await cloudinary.uploader.destroy(reel.videoPublicId, { resource_type: "video" });
    await Reel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
