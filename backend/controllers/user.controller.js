import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import sendNotification from "../utils/sendNotification.js";


export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select("-password")
      .populate("followers", "username avatar fullName")
      .populate("following", "username avatar fullName");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const Post = (await import("../models/post.model.js")).default;
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "username avatar fullName")
      .populate("taggedUsers", "username avatar fullName")
      .populate("comments.user", "username avatar");
    res.json({ success: true, user, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, website, currentPassword, newPassword, isPrivate } = req.body;
    const user = await User.findById(req.user._id);
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (isPrivate !== undefined) user.isPrivate = isPrivate === "true" || isPrivate === true;
    if (req.file) {
      if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId);
      user.avatar = req.file.path;
      user.avatarPublicId = req.file.filename;
    }
    if (newPassword && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });
      user.password = newPassword;
    }
    await user.save();
    const { password: _, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const toggleFollow = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    const target = await User.findById(req.params.userId);
    const me = await User.findById(req.user._id);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    const isFollowing = me.following.includes(req.params.userId);
    if (isFollowing) {
      me.following.pull(req.params.userId);
      target.followers.pull(req.user._id);
    } else {
      me.following.push(req.params.userId);
      target.followers.push(req.user._id);
      await sendNotification({ recipient: req.params.userId, sender: req.user._id, type: "follow", text: `${req.user.username} started following you`, io: req.app.get("io"), userSocketMap: req.app.get("onlineUsers") });
    }
    await me.save(); await target.save();
    res.json({ success: true, followed: !isFollowing });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const users = await User.find({ _id: { $nin: [...me.following, req.user._id] } }).select("username avatar fullName followers").limit(6);
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json({ success: true, users: [] });
    const users = await User.find({ username: { $regex: q, $options: "i" } }).select("username avatar fullName").limit(10);
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "No account with that email" });
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    res.json({ success: true, message: "Password reset token generated", resetToken: token, note: "In production, email this token. For development, copy the token and use it at /reset-password" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ success: false, message: "Incorrect password" });
    const Post = (await import("../models/post.model.js")).default;
    await Post.deleteMany({ author: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.clearCookie("jwt");
    res.json({ success: true, message: "Account deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};





