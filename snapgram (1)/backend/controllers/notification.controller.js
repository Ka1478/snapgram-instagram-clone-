import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username avatar fullName")
      .populate("post", "image")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
