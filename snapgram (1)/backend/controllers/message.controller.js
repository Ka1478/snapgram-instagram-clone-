import Message from "../models/message.model.js";
import { getSocketId } from "../socket/socket.js";
import { io } from "../index.js";

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username avatar fullName")
      .populate("receiver", "username avatar fullName")
      .sort({ createdAt: -1 });

    // Get unique conversation partners
    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const partnerId =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver._id.toString()
          : msg.sender._id.toString();

      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        const partner =
          msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;

        const unreadCount = await Message.countDocuments({
          sender: partnerId,
          receiver: userId,
          read: false,
        });

        conversations.push({ partner, lastMessage: msg, unreadCount });
      }
    }

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;

    if (!text && !req.file) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: userId,
      text,
      image: req.file?.path,
    });

    await message.populate("sender", "username avatar");

    // Emit real-time message
    const receiverSocketId = getSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
