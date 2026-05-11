import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  text: { type: String, default: "" },
  image: { type: String, default: "" },
  isAI: { type: Boolean, default: false },
  mcq: {
    question: { type: String },
    options: [{ type: String }],
    answer: { type: String },
  },
}, { timestamps: true });

const groupChatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [groupMessageSchema],
  lastMessage: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("GroupChat", groupChatSchema);