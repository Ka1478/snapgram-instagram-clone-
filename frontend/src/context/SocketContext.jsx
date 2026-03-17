import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [notifCount, setNotifCount] = useState(0);
  const ringTimeoutRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io("/", {
        query: { userId: user._id },
        withCredentials: true,
      });

      newSocket.on("onlineUsers", (users) => setOnlineUsers(users));

      newSocket.on("newNotification", () => setNotifCount(c => c + 1));

      newSocket.on("incomingCall", ({ from, fromName, fromAvatar, offer }) => {
        setIncomingCall({
          partnerId: from,
          partnerName: fromName || "Unknown",
          partnerAvatar: fromAvatar || "",
          offer,
          isIncoming: true,
        });
        // Auto reject after 30 seconds
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = setTimeout(() => {
          newSocket.emit("rejectCall", { to: from });
          setIncomingCall(null);
        }, 30000);
      });

      newSocket.on("callRejected", () => {
        setActiveCall(null);
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      });

      newSocket.on("callEnded", () => {
        setActiveCall(null);
        setIncomingCall(null);
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      });

      setSocket(newSocket);
      return () => {
        newSocket.close();
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      };
    } else {
      if (socket) { socket.close(); setSocket(null); }
    }
  }, [isAuthenticated, user?._id]);

  const startCall = (partnerId, partnerInfo) => {
    const id = partnerId || partnerInfo?._id;
    const name = partnerInfo?.username || partnerInfo?.fullName || "User";
    const avatar = partnerInfo?.avatar || "";
    setActiveCall({ partnerId: id, partnerName: name, partnerAvatar: avatar, isIncoming: false });
  };

  const acceptCall = () => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    setActiveCall({ ...incomingCall });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    if (socket && incomingCall) socket.emit("rejectCall", { to: incomingCall.partnerId });
    setIncomingCall(null);
  };

  const endCall = () => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    if (socket && activeCall) socket.emit("endCall", { to: activeCall.partnerId });
    setActiveCall(null);
    setIncomingCall(null);
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, startCall, endCall, notifCount, setNotifCount }}>
      {children}
      {incomingCall && !activeCall && (
        <IncomingCallAlert
          callData={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
      {activeCall && socket && (
        <VideoCall
          socket={socket}
          callData={activeCall}
          currentUser={user}
          onClose={endCall}
        />
      )}
    </SocketContext.Provider>
  );
};
