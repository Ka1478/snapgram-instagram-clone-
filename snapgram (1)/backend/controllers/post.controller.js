import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";
import { getSocketId } from "../socket/socket.js";
import { io } from "../index.js";

export const createPost = async (req, res) => {
  try {
    const { caption, location, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const post = await Post.create({
      author: req.user._id,
      image: req.file.path,
      imagePublicId: req.file.filename,
      caption,
      location,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { posts: post._id } });

    const populated = await post.populate("author", "username avatar fullName");
    res.status(201).json({ success: true, post: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (post.imagePublicId) await cloudinary.uploader.destroy(post.imagePublicId);

    await Post.findByIdAndDelete(req.params.postId);
    await User.findByIdAndUpdate(req.user._id, { $pull: { posts: post._id } });

    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const feedUsers = [...currentUser.following, req.user._id];

    const posts = await Post.find({ author: { $in: feedUsers } })
      .populate("author", "username avatar fullName")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: { $in: feedUsers } });

    res.json({
      success: true,
      posts,
      hasMore: skip + posts.length < total,
      page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("author", "username avatar fullName")
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author", "username avatar fullName")
      .populate("comments.user", "username avatar fullName");

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      await Post.findByIdAndUpdate(req.params.postId, { $pull: { likes: req.user._id } });
      res.json({ success: true, liked: false, likesCount: post.likes.length - 1 });
    } else {
      await Post.findByIdAndUpdate(req.params.postId, { $addToSet: { likes: req.user._id } });

      if (post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: "like",
          post: post._id,
          message: `${req.user.username} liked your post`,
        });

        const socketId = getSocketId(post.author.toString());
        if (socketId) {
          io.to(socketId).emit("notification", await notification.populate("sender", "username avatar"));
        }
      }

      res.json({ success: true, liked: true, likesCount: post.likes.length + 1 });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Comment text required" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = { user: req.user._id, text };
    post.comments.push(comment);
    await post.save();

    await post.populate("comments.user", "username avatar fullName");
    const newComment = post.comments[post.comments.length - 1];

    if (post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.username} commented: "${text.slice(0, 50)}"`,
      });

      const socketId = getSocketId(post.author.toString());
      if (socketId) {
        io.to(socketId).emit("notification", await notification.populate("sender", "username avatar"));
      }
    }

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (
      comment.user.toString() !== req.user._id.toString() &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveUnsavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isSaved = user.saved.includes(req.params.postId);

    if (isSaved) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { saved: req.params.postId } });
      res.json({ success: true, saved: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { saved: req.params.postId } });
      res.json({ success: true, saved: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
