import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import GroupChat from "../models/groupChat.model.js";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  askAI,
  generateMCQ,
} from "../controllers/groupChat.controller.js";

const router = express.Router();
router.use(protect);

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

router.post("/ai/parse-pdf", protect, async (req, res) => {
  try {
    const { base64 } = req.body;
    const buffer = Buffer.from(base64, "base64");
    const data = await pdfParse(buffer);
    // Limit to 4000 chars to stay within token limits
    const text = data.text.slice(0, 4000);
    res.json({ success: true, text });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to parse PDF" });
  }
});

router.post("/", createGroup);
router.get("/", getMyGroups);

// AI routes MUST come before /:groupId to avoid Express matching "ai" as a groupId
router.post("/ai/ask", askAI);
router.post("/ai/mcq", generateMCQ);

router.get("/:groupId", getGroupMessages);
router.post("/:groupId/message", sendGroupMessage);

router.delete("/:groupId/messages/clear", async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    group.messages = [];
    group.lastMessage = "";
    await group.save();
    res.json({ success: true, message: "Cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
export default router;