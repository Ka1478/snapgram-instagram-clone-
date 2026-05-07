import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import notificationRoutes from "./routes/notification.route.js";
import storyRoutes from "./routes/story.route.js";
import reelRoutes from "./routes/reel.route.js";
import aiRoutes from "./routes/ai.route.js";
import hashtagRoutes from "./routes/hashtag.route.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.set("io", io);
export const onlineUsers = new Map();
app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  }

  // Messaging
  socket.on("typing", ({ receiverId }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("typing", { senderId: userId });
  });
  socket.on("stopTyping", ({ receiverId }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("stopTyping", { senderId: userId });
  });

  // Video calling
  socket.on("callUser", ({ to, offer, from, fromName, fromAvatar }) => {
    const receiverSocket = onlineUsers.get(to);
    console.log(`Call from ${from} to ${to} - receiver online: ${!!receiverSocket}`);
    console.log("Online users:", Array.from(onlineUsers.keys()));
    if (receiverSocket) {
      io.to(receiverSocket).emit("incomingCall", { from, fromName, fromAvatar, offer });
    } else {
      // Notify caller that recipient is offline
      io.to(socket.id).emit("callRejected", { reason: "User is offline" });
    }
  });

  socket.on("answerCall", ({ to, answer }) => {
    const s = onlineUsers.get(to);
    if (s) io.to(s).emit("callAnswered", { answer });
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const s = onlineUsers.get(to);
    if (s) io.to(s).emit("iceCandidate", { candidate });
  });

  socket.on("endCall", ({ to }) => {
    const s = onlineUsers.get(to);
    if (s) io.to(s).emit("callEnded");
  });

  socket.on("rejectCall", ({ to }) => {
    const s = onlineUsers.get(to);
    if (s) io.to(s).emit("callRejected");
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

app.use(cors({
  origin: ["https://cheery-stroopwafel-de0527.netlify.app", "http://localhost:5173", process.env.CLIENT_URL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/hashtags", hashtagRoutes);

app.use("/api/ai", aiRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error("MongoDB error:", err));







