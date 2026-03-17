import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  fullName: { type: String, required: true },
  avatar: { type: String, default: "" },
  avatarPublicId: { type: String, default: "" },
  bio: { type: String, maxlength: 150, default: "" },
  website: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  isPrivate: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
