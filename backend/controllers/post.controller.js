import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import sendNotification from "../utils/sendNotification.js";

export const createPost = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Image required" });
    const { caption, location, taggedUsers } = req.body;
    const hashtags = caption ? [...caption.matchAll(/#([\w]+)/g)].map(m => m[1].toLowerCase()) : [];
    let taggedIds = [];
    if (taggedUsers) {
      const names = JSON.parse(taggedUsers);
      const users = await User.find({ username: { $in: names } }).select("_id username");
      taggedIds = users.map(u => u._id);
    }
    const post = await Post.create({
      author: req.user._id, image: req.file.path, imagePublicId: req.file.filename,
      caption, location, hashtags, taggedUsers: taggedIds,
    });
    await post.populate("author", "username avatar fullName");
    await post.populate("taggedUsers", "username avatar fullName");
    await User.findByIdAndUpdate(req.user._id, { $push: { posts: post._id } });
    for (const uid of taggedIds) {
      if (uid.toString() !== req.user._id.toString()) {
        await sendNotification({ recipient: uid, sender: req.user._id, type: "mention", post: post._id, text: `${req.user.username} tagged you in a post`, io: req.app.get("io"), userSocketMap: req.app.get("onlineUsers") });
      }
    }
    res.status(201).json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });
    const { caption, location } = req.body;
    if (caption !== undefined) {
      post.caption = caption;
      post.hashtags = [...caption.matchAll(/#([\w]+)/g)].map(m => m[1].toLowerCase());
    }
    if (location !== undefined) post.location = location;
    await post.save();
    await post.populate("author", "username avatar fullName");
    await post.populate("taggedUsers", "username avatar fullName");
    await post.populate("comments.user", "username avatar");
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author", "username avatar fullName")
      .populate("comments.user", "username avatar fullName")
      .populate("taggedUsers", "username avatar fullName")
      .populate("likes", "username avatar");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.views += 1;
    if (!post.viewedBy.includes(req.user._id)) post.viewedBy.push(req.user._id);
    await post.save();
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (post.imagePublicId) await cloudinary.uploader.destroy(post.imagePublicId);
    await Post.findByIdAndDelete(req.params.postId);
    await User.findByIdAndUpdate(req.user._id, { $pull: { posts: post._id } });
    res.json({ success: true, message: "Post deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = [...user.following, req.user._id];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const posts = await Post.find({ author: { $in: ids } })
      .populate("author", "username avatar fullName")
      .populate("comments.user", "username avatar")
      .populate("taggedUsers", "username avatar fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Post.countDocuments({ author: { $in: ids } });
    res.json({ success: true, posts, hasMore: page * limit < total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const posts = await Post.find()
      .populate("author", "username avatar fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ success: true, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) post.likes.pull(req.user._id);
    else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await sendNotification({ recipient: post.author, sender: req.user._id, type: "like", post: post._id, text: `${req.user.username} liked your post`, io: req.app.get("io"), userSocketMap: req.app.get("onlineUsers") });
      }
    }
    await post.save();
    res.json({ success: true, liked: !isLiked, likesCount: post.likes.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const toggleSave = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isSaved = user.saved.includes(req.params.postId);
    if (isSaved) user.saved.pull(req.params.postId);
    else user.saved.push(req.params.postId);
    await user.save();
    res.json({ success: true, saved: !isSaved });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Text required" });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate("comments.user", "username avatar fullName");
    const comment = post.comments[post.comments.length - 1];
    if (post.author.toString() !== req.user._id.toString()) {
      await sendNotification({ recipient: post.author, sender: req.user._id, type: "comment", post: post._id, text: `${req.user.username} commented: ${text.substring(0, 50)}`, io: req.app.get("io"), userSocketMap: req.app.get("onlineUsers") });
    }
    res.status(201).json({ success: true, comment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.user.toString() !== req.user._id.toString() && post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });
    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json({ success: true, message: "Comment deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: "saved", populate: { path: "author", select: "username avatar fullName" } });
    res.json({ success: true, posts: user.saved });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getTaggedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ taggedUsers: req.params.userId })
      .populate("author", "username avatar fullName")
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.reactions = post.reactions.filter(r => r.user.toString() !== req.user._id.toString());
    if (emoji) post.reactions.push({ user: req.user._id, emoji });
    await post.save();
    res.json({ success: true, reactions: post.reactions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const sharePost = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const Message = (await import("../models/message.model.js")).default;
    await Message.create({ sender: req.user._id, receiver: recipientId, text: `📷 Check out this post: ${process.env.CLIENT_URL}/posts/${post._id}` });
    post.shares = (post.shares || 0) + 1;
    await post.save();
    const io = req.app.get("io");
    const userSocketMap = req.app.get("onlineUsers");
    const recipientSocket = userSocketMap?.get(recipientId);
    if (recipientSocket) io.to(recipientSocket).emit("newMessage", { sender: req.user._id });
    res.json({ success: true, message: "Post shared" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPostAnalytics = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("author", "_id");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author._id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });
    const author = await User.findById(req.user._id);
    const reach = author.followers.length;
    const engagement = post.views > 0 ? (((post.likes.length + post.comments.length) / post.views) * 100).toFixed(1) : 0;
    res.json({ success: true, views: post.views, reach, likes: post.likes.length, comments: post.comments.length, saves: post.saves?.length || 0, shares: post.shares || 0, engagement });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const uploadTempImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Image required" });
    res.json({ success: true, url: req.file.path });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
