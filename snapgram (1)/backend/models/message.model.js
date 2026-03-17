import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    image: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
