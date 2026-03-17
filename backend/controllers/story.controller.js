import Story from "../models/story.model.js";
import cloudinary from "../config/cloudinary.js";
import sendNotification from "../utils/sendNotification.js";
import Message from "../models/message.model.js";


export const getStories = async (req, res) => {
  try {
    const User = (await import("../models/user.model.js")).default;
    const user = await User.findById(req.user._id);
    const ids = [...user.following, req.user._id];
    const stories = await Story.find({ author: { $in: ids }, expiresAt: { $gt: new Date() } })
      .populate("author", "username avatar fullName")
      .populate("viewers", "username avatar")
      .sort({ createdAt: -1 });
    const grouped = {};
    stories.forEach(s => {
      const aid = s.author._id.toString();
      if (!grouped[aid]) grouped[aid] = { author: s.author, stories: [] };
      grouped[aid].stories.push(s);
    });
    res.json({ success: true, stories: Object.values(grouped) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Media required" });
    const story = await Story.create({ author: req.user._id, media: req.file.path, mediaPublicId: req.file.filename, caption: req.body.caption || "" });
    await story.populate("author", "username avatar fullName");
    res.status(201).json({ success: true, story });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    if (!story.viewers.includes(req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
      if (story.author.toString() !== req.user._id.toString()) {
        await sendNotification({ recipient: story.author, sender: req.user._id, type: "story_view", text: `${req.user.username} viewed your story` });
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const replyStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ success: false, message: "Not found" });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Text required" });
    const msg = await Message.create({ sender: req.user._id, receiver: story.author, text: `Story reply: ${text}` });
    const { onlineUsers } = await import("../index.js");
    const recipientSocket = onlineUsers?.get(story.author.toString());
    const { io } = await import("../index.js");
    if (recipientSocket) io.to(recipientSocket).emit("newMessage", msg);
    res.status(201).json({ success: true, message: "Replied to story" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    if (story.author.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (story.mediaPublicId) await cloudinary.uploader.destroy(story.mediaPublicId);
    await Story.findByIdAndDelete(req.params.storyId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

