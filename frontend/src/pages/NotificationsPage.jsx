import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { NotificationSkeleton } from "../components/ui/Skeletons";

const FILTERS = ["All", "Unread", "Likes", "Comments", "Follows", "Mentions", "Stories"];
const typeMap = { like:"Likes", comment:"Comments", follow:"Follows", mention:"Mentions", story_view:"Stories" };

export default function NotificationsPage() {
  const { theme } = useTheme();
  const { setNotifCount } = useSocket();
  const isDark = theme === "dark";
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications").then(r => {
      setNotifs(r.data.notifications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put("/notifications/read-all").catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    if (typeof setNotifCount === "function") setNotifCount(0);
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(prev => prev.filter(n => n._id !== id));
  };

  const filtered = notifs.filter(n => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return typeMap[n.type] === filter;
  });

  const notifIcon = (type) => ({ like:"❤️", comment:"💬", follow:"👤", mention:"🏷️", story_view:"⭕" }[type] || "🔔");

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b ${isDark ? "bg-black border-gray-800" : "bg-white border-gray-100"}`}>
        <div className="flex items-center gap-2">
          <Bell size={20} />
          <h1 className="font-bold text-lg">Notifications</h1>
          {notifs.filter(n => !n.read).length > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifs.filter(n => !n.read).length}
            </span>
          )}
        </div>
        {notifs.some(n => !n.read) && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-blue-500 font-medium">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={`flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-gray-900 dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? <NotificationSkeleton /> : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell size={40} strokeWidth={1} className="mb-3" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : filtered.map(n => (
          <div key={n._id} onClick={() => markRead(n._id)}
            className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${!n.read ? isDark ? "bg-blue-950/30" : "bg-blue-50/60" : ""} hover:bg-gray-50 dark:hover:bg-gray-900`}>
            <div className="relative flex-shrink-0">
              <img src={n.sender?.avatar || `https://ui-avatars.com/api/?name=${n.sender?.fullName}&background=random`}
                className="w-11 h-11 rounded-full object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">{notifIcon(n.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <Link to={`/profile/${n.sender?.username}`} className="font-semibold hover:underline">{n.sender?.username}</Link>
                {" "}<span className="text-gray-600 dark:text-gray-400">{n.text?.replace(n.sender?.username + " ", "") || ""}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {n.post?.image && (
                <Link to={`/posts/${n.post._id}`}>
                  <img src={n.post.image} className="w-10 h-10 object-cover rounded-md" />
                </Link>
              )}
              <button onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
