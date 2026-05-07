import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { generateCaption, generateCaptionIdeas } from "../controllers/ai.controller.js";

const router = express.Router();
router.use(protect);
router.post("/generate-caption", generateCaption);
router.post("/caption-ideas", generateCaptionIdeas);

export default router;
