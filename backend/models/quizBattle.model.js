import mongoose from "mongoose";

const quizBattleSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupChat", required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: String, required: true },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  answers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      answer: String,
      correct: Boolean,
      answeredAt: { type: Date, default: Date.now },
    }
  ],
 topic: { type: String, default: "" },
  allQuestions: { type: Array, default: [] },   // ← stores all 10 questions
  currentQuestion: { type: Number, default: 0 }, // ← tracks current index
}, { timestamps: true });

export default mongoose.model("QuizBattle", quizBattleSchema);
