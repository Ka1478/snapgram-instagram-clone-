const userSocketMap = {}; // { userId: socketId }

export const getSocketId = (userId) => userSocketMap[userId];

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(userSocketMap));
      console.log(`✅ User ${userId} connected: ${socket.id}`);
    }

    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = getSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId: userId });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = getSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        delete userSocketMap[userId];
        io.emit("onlineUsers", Object.keys(userSocketMap));
        console.log(`❌ User ${userId} disconnected`);
      }
    });
  });
};
