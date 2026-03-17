import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "../../utils/api";
import { useAuthStore } from "../../context/authStore";
import { useSocket } from "../../context/SocketContext";
import toast from "react-hot-toast";

export default function ChatWindow({ partnerId, partnerInfo, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuthStore();
  const { socket, onlineUsers } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isOnline = onlineUsers.includes(partnerId);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${partnerId}`);
        setMessages(res.data.messages);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [partnerId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (message) => {
      if (message.sender._id === partnerId || message.sender === partnerId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId === partnerId) setIsTyping(true);
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (senderId === partnerId) setIsTyping(false);
    });

    return () => {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, partnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    socket?.emit("typing", { receiverId: partnerId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("stopTyping", { receiverId: partnerId });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const tempMessage = {
      _id: Date.now(),
      sender: { _id: user._id },
      text,
      createdAt: new Date().toISOString(),
      temp: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setText("");

    try {
      const res = await api.post(`/messages/${partnerId}`, { text: text.trim() });
      setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? res.data.message : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
        {onBack && (
          <button onClick={onBack} className="md:hidden text-gray-500">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="relative">
          <img
            src={partnerInfo?.avatar || `https://ui-avatars.com/api/?name=${partnerInfo?.fullName}&background=random`}
            alt={partnerInfo?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black" />
          )}
        </div>
        <div>
          <Link to={`/profile/${partnerInfo?.username}`} className="font-semibold text-sm hover:underline">
            {partnerInfo?.username}
          </Link>
          <p className="text-xs text-gray-500">{isOnline ? "Active now" : "Offline"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Say hi to {partnerInfo?.username}! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = (msg.sender?._id || msg.sender) === user._id;
            return (
              <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-sm ${isOwn ? "order-2" : "order-1"}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isOwn
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"
                    } ${msg.temp ? "opacity-70" : ""}`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isOwn ? "text-right" : ""}`}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Message..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="text-blue-500 disabled:text-gray-400 transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
