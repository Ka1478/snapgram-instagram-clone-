import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const reelSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: String, required: true },
    videoPublicId: String,
    caption: { type: String, maxlength: 2200, default: "" },
    audio: { type: String, default: "Original Audio" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Reel", reelSchema);
