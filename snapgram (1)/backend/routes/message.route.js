import express from "express";
import { getConversations, getMessages, sendMessage } from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.get("/:userId", getMessages);
router.post("/:userId", sendMessage);

export default router;
