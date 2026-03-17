import Notification from "../models/notification.model.js";
import { io as globalIo, onlineUsers as globalOnlineUsers } from "../index.js";

const sendNotification = async ({ recipient, sender, type, post, text, message, io, userSocketMap }) => {
  try {
    if (recipient.toString() === sender.toString()) return;

    const notification = await Notification.create({ recipient, sender, type, post, text, message });
    await notification.populate("sender", "username avatar fullName");
    if (post) await notification.populate("post", "image");

    const socketMap = userSocketMap || globalOnlineUsers;
    const ioInstance = io || globalIo;

    const recipientSocket = socketMap?.get(recipient.toString());
    if (recipientSocket && ioInstance) {
      ioInstance.to(recipientSocket).emit("newNotification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Notification error:", error);
  }
};

export default sendNotification;
export { sendNotification };
