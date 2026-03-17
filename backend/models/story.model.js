import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    media: { type: String, required: true },
    mediaPublicId: String,
    caption: { type: String, maxlength: 200, default: "" },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

export default mongoose.model("Story", storySchema);
