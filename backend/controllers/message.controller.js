import Message from "../models/message.model.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

const msgImgStorage = new CloudinaryStorage({ cloudinary, params: { folder: "snapgram/messages", allowed_formats: ["jpg","jpeg","png","webp"], transformation: [{ width: 1080, quality: "auto" }] } });
export const uploadMsgImage = multer({ storage: msgImgStorage, limits: { fileSize: 5 * 1024 * 1024 } }).single("image");

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const msgs = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"] }, lastMessage: { $first: "$$ROOT" }, unread: { $sum: { $cond: [{ $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$read", false] }] }, 1, 0] } } } },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);
    const populated = await Message.populate(msgs, [{ path: "_id", model: "User", select: "username avatar fullName" }, { path: "lastMessage.sender", model: "User", select: "username avatar" }, { path: "lastMessage.receiver", model: "User", select: "username avatar" }]);
    res.json({ success: true, conversations: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getMessages = async (req, res) => {
  try {
    const msgs = await Message.find({ $or: [{ sender: req.user._id, receiver: req.params.userId }, { sender: req.params.userId, receiver: req.user._id }] }).sort({ createdAt: 1 });
    await Message.updateMany({ sender: req.params.userId, receiver: req.user._id, read: false }, { read: true, readAt: new Date() });
    res.json({ success: true, messages: msgs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const image = req.file ? req.file.path : "";
    if (!text?.trim() && !image) return res.status(400).json({ success: false, message: "Message or image required" });
    const msg = await Message.create({ sender: req.user._id, receiver: req.params.userId, text: text || "", image });
    const io = req.app.get("io");
    const userSocketMap = req.app.get("onlineUsers");
    const recipientSocket = userSocketMap?.get(req.params.userId);
    if (recipientSocket) io.to(recipientSocket).emit("newMessage", msg);
    res.status(201).json({ success: true, message: msg });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Not found" });
    if (msg.sender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (msg.image) {
      const publicId = msg.image.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    await Message.findByIdAndDelete(req.params.messageId);
    const io = req.app.get("io");
    const userSocketMap = req.app.get("onlineUsers");
    const recipientSocket = userSocketMap?.get(msg.receiver.toString());
    if (recipientSocket) io.to(recipientSocket).emit("messageDeleted", { messageId: req.params.messageId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const markRead = async (req, res) => {
  try {
    await Message.updateMany({ sender: req.params.userId, receiver: req.user._id, read: false }, { read: true, readAt: new Date() });
    const io = req.app.get("io");
    const userSocketMap = req.app.get("onlineUsers");
    const senderSocket = userSocketMap?.get(req.params.userId);
    if (senderSocket) io.to(senderSocket).emit("messagesRead", { by: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

