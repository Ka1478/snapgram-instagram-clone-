import GroupChat from "../models/groupChat.model.js";
import Groq from "groq-sdk";

let groq;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};

export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const members = [...new Set([...memberIds, req.user._id.toString()])];
    const group = await GroupChat.create({ name, members, admins: [req.user._id] });
    await group.populate("members", "username avatar fullName");
    res.status(201).json({ success: true, group });
  } catch (err) {
    console.error("createGroup error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const groups = await GroupChat.find({ members: req.user._id })
      .populate("members", "username avatar fullName")
      .select("-messages")
      .sort({ updatedAt: -1 });
    res.json({ success: true, groups });
  } catch (err) {
    console.error("getMyGroups error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId)
      .populate("members", "username avatar fullName")
      .populate("messages.sender", "username avatar");
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!group.members.some(m => m._id.toString() === req.user._id.toString()))
      return res.status(403).json({ success: false, message: "Not a member" });
    res.json({ success: true, group });
  } catch (err) {
    console.error("getGroupMessages error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Message required" });

    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    group.messages.push({ sender: req.user._id, text });
    group.lastMessage = text;
    await group.save();
    await group.populate("messages.sender", "username avatar");

    const savedMsg = group.messages[group.messages.length - 1];

    try {
      const { io } = await import("../index.js");
      io.to(`group_${group._id}`).emit("newGroupMessage", {
        groupId: group._id,
        message: savedMsg,
      });
    } catch {}

    res.status(201).json({ success: true, message: savedMsg });
  } catch (err) {
    console.error("sendGroupMessage error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const askAI = async (req, res) => {
  console.log("ASK AI HIT", req.body);
  try {
    const { question, groupId, imageBase64, imageType, pdfText } = req.body;
    if (!question && !imageBase64 && !pdfText)
      return res.status(400).json({ success: false, message: "Question or file required" });

    const content = [];

    if (question) content.push({ type: "text", text: question });

    if (imageBase64 && imageType) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${imageType};base64,${imageBase64}` },
      });
    }

    if (pdfText) {
      content.push({
        type: "text",
        text: `Here is the content of the uploaded PDF:\n\n${pdfText}\n\nPlease answer based on this document.`,
      });
    }

    const response = await getGroq().chat.completions.create({
      model: "qwen/qwen3.6-27b",  // ✅ fixed
      messages: [{ role: "user", content }],
      max_tokens: 1000,
      reasoning_effort: "none",
    });

    let answer = response.choices[0]?.message?.content?.trim();
    if (!answer) throw new Error("No response from AI");

    // Strip <think> block if present
    answer = answer.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    const group = await GroupChat.findById(groupId);
    if (group) {
      group.messages.push({ isAI: true, text: answer });
      group.lastMessage = "🤖 AI replied";
      await group.save();
      try {
        const { io } = await import("../index.js");
        const aiMsg = group.messages[group.messages.length - 1];
        io.to(`group_${groupId}`).emit("newGroupMessage", { groupId, message: aiMsg });
      } catch {}
    }

    res.json({ success: true, answer });
  } catch (err) {
    console.error("ASK AI ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateMCQ = async (req, res) => {
  console.log("MCQ HIT", req.body);
  try {
    const { topic, groupId } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "Topic required" });

    const response = await getGroq().chat.completions.create({
      model: "qwen/qwen3.6-27b",  // ✅ fixed
      messages: [{
        role: "user",
        content: `Generate 10 different MCQ questions about "${topic}". Return ONLY a raw JSON array with no explanation, no markdown, no backticks, no extra text. Format exactly like this:
[
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A"},
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"B"}
]
Make all 10 questions unique and cover different aspects of the topic.`,
      }],
      max_tokens: 3000,
      reasoning_effort: "none",
    });

    let raw = response.choices[0]?.message?.content?.trim();

    // Strip <think> block if present
    raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    console.log("MCQ RAW RESPONSE:", raw);

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");
    const mcqs = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      throw new Error("Invalid MCQ structure from AI");
    }

    const group = await GroupChat.findById(groupId);
    if (group) {
      for (const mcq of mcqs) {
        if (!mcq.question || !mcq.options || !mcq.answer) continue;
        group.messages.push({ isAI: true, text: `📝 MCQ: ${mcq.question}`, mcq });
      }
      group.lastMessage = `📝 AI posted ${mcqs.length} MCQs`;
      await group.save();
      try {
        const { io } = await import("../index.js");
        const aiMessages = group.messages.slice(-mcqs.length);
        for (const msg of aiMessages) {
          io.to(`group_${groupId}`).emit("newGroupMessage", { groupId, message: msg });
        }
      } catch {}
    }

    res.json({ success: true, mcqs });
  } catch (err) {
    console.error("MCQ ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};