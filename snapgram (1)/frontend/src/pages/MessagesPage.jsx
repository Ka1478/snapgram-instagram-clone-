import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageSquarePlus, Search } from "lucide-react";
import api from "../utils/api";
import ChatWindow from "../components/chat/ChatWindow";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useSocket } from "../context/SocketContext";
import { useAuthStore } from "../context/authStore";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/messages/conversations");
        setConversations(res.data.conversations);

        if (userId) {
          const conv = res.data.conversations.find(c => c.partner._id === userId);
          if (conv) setSelectedUser(conv.partner);
          else {
            try {
              const uRes = await api.get(`/users/${userId}`);
              setSelectedUser(uRes.data.user);
            } catch {}
          }
        }
      } catch {} finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", () => {
      // Refresh conversations
    });
    return () => socket.off("newMessage");
  }, [socket]);

  return (
    <div className="flex h-[calc(100vh-100px)] md:h-[calc(100vh-40px)] card overflow-hidden -mx-4 md:mx-0">
      {/* Conversation list */}
      <div className={`${selectedUser ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{user?.username}</h2>
            <MessageSquarePlus size={20} className="cursor-pointer hover:text-gray-500" />
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search messages"
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquarePlus size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">Your messages</p>
              <p className="text-sm text-gray-500 mt-1">Send private photos and messages to a friend.</p>
            </div>
          ) : (
            conversations.map(({ partner, lastMessage, unreadCount }) => (
              <button
                key={partner._id}
                onClick={() => setSelectedUser(partner)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left ${
                  selectedUser?._id === partner._id ? "bg-gray-50 dark:bg-gray-900" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={partner.avatar || `https://ui-avatars.com/api/?name=${partner.fullName}&background=random`}
                    alt={partner.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
                      {partner.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                    </p>
                  </div>
                  <p className={`text-sm truncate ${unreadCount > 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500"}`}>
                    {lastMessage.sender._id === user?._id ? "You: " : ""}{lastMessage.text || "Sent a photo"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {selectedUser ? (
          <ChatWindow
            partnerId={selectedUser._id}
            partnerInfo={selectedUser}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full border-2 border-gray-900 dark:border-white flex items-center justify-center mb-4">
              <MessageSquarePlus size={36} />
            </div>
            <h3 className="text-xl font-light mb-2">Your messages</h3>
            <p className="text-gray-500 text-sm mb-4">
              Send private photos and messages to a friend or group.
            </p>
            <button className="btn-primary text-sm">Send message</button>
          </div>
        )}
      </div>
    </div>
  );
}
