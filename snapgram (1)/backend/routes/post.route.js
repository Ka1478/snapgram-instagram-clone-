import express from "express";
import {
  createPost,
  deletePost,
  getFeedPosts,
  getExplorePosts,
  getPost,
  likeUnlikePost,
  addComment,
  deleteComment,
  saveUnsavePost,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { uploadPost } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/feed", getFeedPosts);
router.get("/explore", getExplorePosts);
router.post("/", uploadPost.single("image"), createPost);
router.get("/:postId", getPost);
router.delete("/:postId", deletePost);
router.post("/:postId/like", likeUnlikePost);
router.post("/:postId/save", saveUnsavePost);
router.post("/:postId/comments", addComment);
router.delete("/:postId/comments/:commentId", deleteComment);

export default router;
