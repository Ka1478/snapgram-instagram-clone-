import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";
import { getSocketId } from "../socket/socket.js";
import { io } from "../index.js";

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .populate("followers", "username avatar fullName")
      .populate("following", "username avatar fullName")
      .populate({ path: "posts", options: { sort: { createdAt: -1 } } });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, website } = req.body;
    const updateData = { fullName, bio, website };

    if (req.file) {
      if (req.user.avatarPublicId) {
        await cloudinary.uploader.destroy(req.user.avatarPublicId);
      }
      updateData.avatar = req.file.path;
      updateData.avatarPublicId = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const followUnfollow = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    if (userId === currentUser._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUser._id, { $pull: { following: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { followers: currentUser._id } });
      res.json({ success: true, message: "Unfollowed", following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUser._id, { $addToSet: { following: userId } });
      await User.findByIdAndUpdate(userId, { $addToSet: { followers: currentUser._id } });

      // Create notification
      const notification = await Notification.create({
        recipient: userId,
        sender: currentUser._id,
        type: "follow",
        message: `${currentUser.username} started following you`,
      });

      // Emit real-time notification
      const socketId = getSocketId(userId);
      if (socketId) {
        io.to(socketId).emit("notification", await notification.populate("sender", "username avatar"));
      }

      res.json({ success: true, message: "Followed", following: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const excludeIds = [...currentUser.following, currentUser._id];

    const users = await User.find({ _id: { $nin: excludeIds } })
      .select("username fullName avatar followers")
      .limit(10);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ],
    })
      .select("username fullName avatar followers")
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
