import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: { type: String, required: true },
    imagePublicId: String,
    caption: { type: String, maxlength: 2200, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    tags: [{ type: String }],
    location: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
