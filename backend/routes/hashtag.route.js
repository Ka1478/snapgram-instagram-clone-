import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.get("/trending", async (req, res) => {
  try {
    const { default: Post } = await import("../models/post.model.js");
    const trending = await Post.aggregate([
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { hashtag: "$_id", count: 1, _id: 0 } },
    ]);
    res.json({ success: true, trending });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get("/:tag", async (req, res) => {
  try {
    const { default: Post } = await import("../models/post.model.js");
    const hashtag = req.params.tag.toLowerCase().replace("#", "");
    const posts = await Post.find({ hashtags: `#${hashtag}` })
      .populate("author", "username avatar fullName")
      .sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, posts, hashtag, total: posts.length });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post("/posts/:postId/react", async (req, res) => {
  try {
    const { default: Post } = await import("../models/post.model.js");
    const { emoji } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.reactions = post.reactions.filter(r => r.user.toString() !== req.user._id.toString());
    post.reactions.push({ user: req.user._id, emoji });
    await post.save();
    const grouped = post.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {});
    res.json({ success: true, reactions: grouped });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get("/posts/:postId/analytics", async (req, res) => {
  try {
    const { default: Post } = await import("../models/post.model.js");
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    res.json({ success: true, analytics: {
      views: post.views || 0,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      saves: post.saves || 0,
      shares: post.shares || 0,
      reach: post.viewedBy?.length || 0,
      engagementRate: post.views > 0
        ? (((post.likes?.length + post.comments?.length) / post.views) * 100).toFixed(2) : 0,
    }});
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

export default router;
