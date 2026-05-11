import QuizBattle from "../models/quizBattle.model.js";
import Groq from "groq-sdk";

let groq;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};

// Start a new quiz battle — generates MCQ and waits for opponent
export const startBattle = async (req, res) => {
  try {
    const { groupId, topic } = req.body;
    if (!groupId || !topic) return res.status(400).json({ success: false, message: "groupId and topic required" });

    // Generate MCQ using Groq
    const response = await getGroq().chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: `Generate 10 different challenging MCQ questions about "${topic}". Return ONLY a raw JSON array, no explanation, no markdown, no backticks:
[
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A"},
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"B"}
]
Make all 10 questions unique, progressively harder, covering different aspects.`,
      }],
      max_tokens: 3000,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
if (!jsonMatch) throw new Error("AI did not return valid JSON");
const mcqs = JSON.parse(jsonMatch[0]);

if (!Array.isArray(mcqs) || mcqs.length === 0) throw new Error("Invalid MCQ from AI");

// Pick first valid question to start, store all as questions array
const firstMCQ = mcqs[0];

const battle = await QuizBattle.create({
  groupId,
  question: firstMCQ.question,
  options: firstMCQ.options,
  answer: firstMCQ.answer,
  allQuestions: mcqs,          // store all 10 questions
  currentQuestion: 0,          // track which question is active
  startedBy: req.user._id,
  challenger: req.user._id,
  topic,
  status: "waiting",
});

    await battle.populate("challenger", "username avatar");

    // Notify group via socket
    try {
      const { io } = await import("../index.js");
      io.to(`group_${groupId}`).emit("quizBattleStarted", { battle });
    } catch {}

    res.status(201).json({ success: true, battle });
  } catch (err) {
    console.error("startBattle error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Join an existing battle as opponent
export const joinBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = await QuizBattle.findById(battleId)
      .populate("challenger", "username avatar")
      .populate("opponent", "username avatar");

    if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });
    if (battle.status !== "waiting") return res.status(400).json({ success: false, message: "Battle already started" });
    if (battle.challenger._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "You started this battle" });

    battle.opponent = req.user._id;
    battle.status = "active";
    await battle.save();
    await battle.populate("opponent", "username avatar");

    // Notify group via socket
    try {
      const { io } = await import("../index.js");
      io.to(`group_${battle.groupId}`).emit("quizBattleJoined", { battle });
    } catch {}

    res.json({ success: true, battle });
  } catch (err) {
    console.error("joinBattle error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit answer
export const submitAnswer = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { answer } = req.body;

    const battle = await QuizBattle.findById(battleId)
      .populate("challenger", "username avatar")
      .populate("opponent", "username avatar")
      .populate("winner", "username avatar");

    if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });
    if (battle.status !== "active") return res.status(400).json({ success: false, message: "Battle is not active" });

    const userId = req.user._id.toString();
    const alreadyAnswered = battle.answers.find(a => a.user.toString() === userId);
    if (alreadyAnswered) return res.status(400).json({ success: false, message: "Already answered" });

    const correct = answer === battle.answer;
    battle.answers.push({ user: req.user._id, answer, correct, answeredAt: new Date() });

    // If this is the first correct answer → they win
    const firstCorrect = battle.answers.find(a => a.correct);
    if (firstCorrect && !battle.winner) {
      battle.winner = firstCorrect.user;
      battle.status = "finished";
    }

    // If both answered → finish battle
    if (battle.answers.length >= 2) {
      battle.status = "finished";
      if (!battle.winner) {
        // Both wrong — no winner
        battle.winner = null;
      }
    }

    await battle.save();
    await battle.populate("winner", "username avatar");

    // Notify group via socket
    try {
      const { io } = await import("../index.js");
      io.to(`group_${battle.groupId}`).emit("quizBattleUpdated", { battle });
    } catch {}

    res.json({ success: true, battle, correct });
  } catch (err) {
    console.error("submitAnswer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get active battles for a group
export const getGroupBattles = async (req, res) => {
  try {
    const { groupId } = req.params;
    const battles = await QuizBattle.find({ groupId, status: { $in: ["waiting", "active"] } })
      .populate("challenger", "username avatar")
      .populate("opponent", "username avatar")
      .populate("winner", "username avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, battles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
