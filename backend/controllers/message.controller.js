import Message from "../models/message.model.js";
import multer from "multer";

export const uploadMsgImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single("image");

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const msgs = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"] }, lastMessage: { $first: "$$ROOT" }, unread: { $sum: { $cond: [{ $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$read", false] }] }, 1, 0] } } } },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);
    const populated = await Message.populate(msgs, [
      { path: "_id", model: "User", select: "username avatar fullName" },
      { path: "lastMessage.sender", model: "User", select: "username avatar" },
      { path: "lastMessage.receiver", model: "User", select: "username avatar" }
    ]);
    res.json({ success: true, conversations: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getMessages = async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true, messages: msgs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const sendMessage = async (req, res) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text : "";
    const imageField = req.body.image;
    const image = typeof imageField === "string" ? imageField : "";
    if (!text.trim() && !image) {
      return res.status(400).json({ success: false, message: "Message or image required" });
    }
    const msg = await Message.create({
      sender: req.user._id,
      receiver: req.params.userId,
      text,
      image
    });
    try {
      const { io, onlineUsers } = await import("../index.js");
      const recipientSocket = onlineUsers?.get(req.params.userId);
      if (recipientSocket) io.to(recipientSocket).emit("newMessage", msg);
    } catch {}
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    console.error("sendMessage error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Not found" });
    if (msg.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });
    await Message.findByIdAndDelete(req.params.messageId);
    try {
      const { io, onlineUsers } = await import("../index.js");
      const recipientSocket = onlineUsers?.get(msg.receiver.toString());
      if (recipientSocket) io.to(recipientSocket).emit("messageDeleted", { messageId: req.params.messageId });
    } catch {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const markRead = async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    try {
      const { io, onlineUsers } = await import("../index.js");
      const senderSocket = onlineUsers?.get(req.params.userId);
      if (senderSocket) io.to(senderSocket).emit("messagesRead", { by: req.user._id });
    } catch {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
