import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Send, Video, ArrowLeft, Image, Trash2, Check, CheckCheck, X, Search, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../context/authStore";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { socket, onlineUsers, startCall } = useSocket();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [typing, setTyping] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    api.get("/messages/conversations")
      .then(r => setConversations(r.data.conversations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", (msg) => {
      if (activeConvo && (msg.sender === activeConvo._id?._id || msg.sender?._id === activeConvo._id?._id)) {
        setMessages(prev => [...prev, msg]);
        api.put(`/messages/${activeConvo._id?._id}/read`).catch(() => {});
      }
      setConversations(prev => prev.map(c =>
        c._id?._id === (msg.sender?._id || msg.sender)
          ? { ...c, lastMessage: { ...msg }, unread: activeConvo?._id?._id === (msg.sender?._id || msg.sender) ? 0 : (c.unread || 0) + 1 }
          : c
      ));
    });
    socket.on("messageDeleted", ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });
    socket.on("messagesRead", ({ by }) => {
      if (activeConvo?._id?._id === by)
        setMessages(prev => prev.map(m => m.sender === user._id ? { ...m, read: true } : m));
    });
    socket.on("typing", ({ senderId }) => {
      if (senderId === activeConvo?._id?._id) setTyping(true);
    });
    socket.on("stopTyping", ({ senderId }) => {
      if (senderId === activeConvo?._id?._id) setTyping(false);
    });
    return () => {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("messagesRead");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, activeConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUserSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${q}`);
        setSearchResults(res.data.users || []);
      } catch {}
      finally { setSearchLoading(false); }
    }, 400);
  };

  const startConvo = async (selectedUser) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    const existing = conversations.find(c => c._id?._id === selectedUser._id);
    if (existing) {
      openConvo(existing);
      return;
    }
    const fakeConvo = {
      _id: { _id: selectedUser._id, username: selectedUser.username, avatar: selectedUser.avatar, fullName: selectedUser.fullName },
      lastMessage: null,
      unread: 0,
    };
    setConversations(prev => [fakeConvo, ...prev]);
    openConvo(fakeConvo);
  };

  const openConvo = async (convo) => {
    setActiveConvo(convo);
    setShowMobile(true);
    try {
      const r = await api.get(`/messages/${convo._id?._id}`);
      setMessages(r.data.messages || []);
      setConversations(prev => prev.map(c => c._id?._id === convo._id?._id ? { ...c, unread: 0 } : c));
      await api.put(`/messages/${convo._id?._id}/read`).catch(() => {});
    } catch {}
  };

  const handleTyping = () => {
    if (!socket || !activeConvo) return;
    socket.emit("typing", { senderId: user._id, receiverId: activeConvo._id?._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() =>
      socket.emit("stopTyping", { senderId: user._id, receiverId: activeConvo._id?._id }), 1000);
  };

  const handleImagePick = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!text?.trim() && !imgFile) return;
    const optimistic = {
      _id: Date.now().toString(),
      sender: user._id,
      receiver: activeConvo._id?._id,
      text, image: imgPreview || "",
      read: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimistic]);
    const savedText = text;
    const savedImgFile = imgFile;
    setText(""); setImgFile(null); setImgPreview(null);
    try {
      let r;
      if (savedImgFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(savedImgFile);
        });
        r = await api.post(`/messages/${activeConvo._id?._id}`, { text: savedText || "", image: base64 });
      } else {
        r = await api.post(`/messages/${activeConvo._id?._id}`, { text: savedText.trim() });
      }
      setMessages(prev => prev.map(m => m._id === optimistic._id ? r.data.message : m));
      setConversations(prev => prev.map(c =>
        c._id?._id === activeConvo._id?._id ? { ...c, lastMessage: r.data.message } : c
      ));
    } catch (err) {
      console.error("SEND ERROR:", err?.response?.data || err?.message || err);
      toast.error("Failed to send: " + (err?.response?.data?.message || err?.message || "unknown error"));
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
    }
  };

  const deleteMsg = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch { toast.error("Failed to delete"); }
  };

  const isOnline = (id) => onlineUsers.includes(id);
  const otherId = activeConvo?._id?._id;

  const filteredConvos = conversations.filter(c =>
    !searchQuery || c._id?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "bg-black text-white" : "bg-white text-gray-900"}`}>

      {/* ── Sidebar ── */}
      <div className={`${showMobile ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r ${isDark ? "border-gray-800" : "border-gray-200"}`}>

        {/* Header */}
        <div className={`p-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-xl">{user?.username}</h2>
            <button onClick={() => setShowSearch(s => !s)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="New message">
              <Edit size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Search / New chat input */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (showSearch) handleUserSearch(e.target.value); }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search or start new chat..."
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); }}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {showSearch && searchQuery && (
          <div className={`border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
            {searchLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">No users found</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-400 px-4 py-2 font-medium">Start a new conversation</p>
                {searchResults.map(u => (
                  <button key={u._id} onClick={() => startConvo(u)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}>
                    <div className="relative flex-shrink-0">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                        className="w-10 h-10 rounded-full object-cover" />
                      {isOnline(u._id) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{u.username}</p>
                      <p className="text-xs text-gray-500">{u.fullName}</p>
                    </div>
                    {isOnline(u._id) && (
                      <span className="ml-auto text-xs text-green-500 font-medium">Active</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !searchQuery ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1 text-center">Search for someone above to start chatting</p>
            </div>
          ) : filteredConvos.length === 0 && searchQuery ? (
            <p className="text-center text-sm text-gray-400 py-8">No conversations match</p>
          ) : (
            filteredConvos.map(convo => {
              const other = convo._id;
              return (
                <button key={other?._id} onClick={() => openConvo(convo)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${activeConvo?._id?._id === other?._id ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
                  <div className="relative flex-shrink-0">
                    <img src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.fullName}&background=random`}
                      className="w-12 h-12 rounded-full object-cover" />
                    {isOnline(other?._id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm truncate">{other?.username}</p>
                    <p className={`text-xs truncate ${convo.unread > 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500"}`}>
                      {convo.lastMessage?.image ? "📷 Photo" : convo.lastMessage?.text || "Say hello 👋"}
                    </p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                      {convo.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className={`${showMobile ? "flex" : "hidden md:flex"} flex-col flex-1 overflow-hidden`}>
        {!activeConvo ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your Messages</p>
            <p className="text-sm mt-1">Search for someone on the left to start a conversation</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobile(false)} className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeft size={20} />
                </button>
                <Link to={`/profile/${activeConvo._id?.username}`} className="flex items-center gap-3">
                  <div className="relative">
                    <img src={activeConvo._id?.avatar || `https://ui-avatars.com/api/?name=${activeConvo._id?.fullName}&background=random`}
                      className="w-9 h-9 rounded-full object-cover" />
                    {isOnline(otherId) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeConvo._id?.username}</p>
                    <p className="text-xs text-gray-500">{isOnline(otherId) ? "Active now" : "Offline"}</p>
                  </div>
                </Link>
              </div>
              <button onClick={() => startCall && startCall(otherId, activeConvo._id)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Video size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <img src={activeConvo._id?.avatar || `https://ui-avatars.com/api/?name=${activeConvo._id?.fullName}&background=random`}
                    className="w-16 h-16 rounded-full object-cover mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{activeConvo._id?.username}</p>
                  <p className="text-sm mt-1">Say hello! 👋</p>
                </div>
              )}
              {messages.map(msg => {
                const isMine = (msg.sender?._id || msg.sender) === user._id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                    <div className={`max-w-xs lg:max-w-md flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {msg.image && (
                        <img src={msg.image} className="rounded-xl max-w-48 mb-1 cursor-pointer"
                          onClick={() => window.open(msg.image)} />
                      )}
                      {msg.text && (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-blue-500 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"}`}>
                          {msg.text}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                        {isMine && (msg.read
                          ? <CheckCheck size={12} className="text-blue-500" />
                          : <Check size={12} className="text-gray-400" />
                        )}
                        {isMine && (
                          <button onClick={() => deleteMsg(msg._id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-400 hover:text-red-600 ml-1">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Image preview */}
            {imgPreview && (
              <div className={`px-4 py-2 border-t ${isDark ? "border-gray-800" : "border-gray-200"} flex items-center gap-2`}>
                <div className="relative">
                  <img src={imgPreview} className="h-16 w-16 object-cover rounded-lg" />
                  <button onClick={() => { setImgFile(null); setImgPreview(null); }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMsg} className={`px-4 py-3 border-t ${isDark ? "border-gray-800" : "border-gray-200"} flex items-center gap-3`}>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0">
                <Image size={20} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
              <input value={text} onChange={e => { setText(e.target.value); handleTyping(); }}
                placeholder="Message..." maxLength={1000}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 text-sm outline-none placeholder-gray-400" />
              <button type="submit" disabled={!text.trim() && !imgFile}
                className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}





