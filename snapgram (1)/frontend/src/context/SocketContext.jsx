import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "./authStore";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io("/", {
        query: { userId: user._id },
        withCredentials: true,
      });

      newSocket.on("onlineUsers", (users) => setOnlineUsers(users));
      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
