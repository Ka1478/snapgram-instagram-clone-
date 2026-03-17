import express from "express";
import {
  getUserProfile,
  updateProfile,
  followUnfollow,
  getSuggestedUsers,
  searchUsers,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/search", searchUsers);
router.get("/suggested", getSuggestedUsers);
router.get("/:username", getUserProfile);
router.put("/profile/update", uploadAvatar.single("avatar"), updateProfile);
router.post("/:userId/follow", followUnfollow);

export default router;
