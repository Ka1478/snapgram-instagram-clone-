import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "./authStore";
import IncomingCallAlert from "../components/call/IncomingCallAlert";
import VideoCall from "../components/call/VideoCall";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io("/", {
        query: { userId: user._id },
        withCredentials: true,
      });
      newSocket.on("onlineUsers", (users) => setOnlineUsers(users));

      // Incoming call
      newSocket.on("incomingCall", ({ from, fromName, fromAvatar, offer }) => {
        setIncomingCall({ partnerId: from, partnerName: fromName, partnerAvatar: fromAvatar, offer, isIncoming: true });
      });

      setSocket(newSocket);
      return () => newSocket.close();
    } else {
      if (socket) { socket.close(); setSocket(null); }
    }
  }, [isAuthenticated, user?._id]);

  const startCall = (partner) => {
    setActiveCall({
      partnerId: partner._id,
      partnerName: partner.username,
      partnerAvatar: partner.avatar,
      isIncoming: false,
    });
  };

  const acceptCall = () => {
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (socket && incomingCall) {
      socket.emit("rejectCall", { to: incomingCall.partnerId });
    }
    setIncomingCall(null);
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, startCall }}>
      {children}

      {/* Incoming call alert */}
      {incomingCall && !activeCall && (
        <IncomingCallAlert
          callData={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active video call */}
      {activeCall && socket && (
        <VideoCall
          socket={socket}
          callData={activeCall}
          currentUser={user}
          onClose={() => setActiveCall(null)}
        />
      )}
    </SocketContext.Provider>
  );
};
