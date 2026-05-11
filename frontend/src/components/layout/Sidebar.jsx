import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Film, MessageCircle, Bell, PlusSquare, User, Sun, Moon, LogOut, Users } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useSocket } from "../../context/SocketContext";
import CreatePostModal from "../post/CreatePostModal";
import api from "../../utils/api";

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { socket } = useSocket();
  const [showCreate, setShowCreate] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/notifications");
        const unread = (res.data.notifications || []).filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch {}
    };
    fetchUnread();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("newNotification", () => {
      setUnreadCount((prev) => prev + 1);
    });
    return () => socket.off("newNotification");
  }, [socket]);

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/reels", icon: Film, label: "Reels" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/groups", icon: Users, label: "Groups" },
    { to: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { to: `/profile/${user?.username}`, icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 xl:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-4 py-6 z-40">
        <Link to="/" className="flex items-center gap-2 px-3 mb-8">
          <div className="w-8 h-8 snapgram-gradient rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">📸</span>
          </div>
          <span className="text-xl font-bold snapgram-text">Snapgram</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <Link key={to} to={to}
              onClick={() => { if (to === "/notifications") setUnreadCount(0); }}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all font-medium text-sm relative ${isActive(to) ? "bg-gray-100 dark:bg-gray-900 font-bold" : "hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"}`}>
              <div className="relative">
                <Icon size={22} strokeWidth={isActive(to) ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          ))}
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all font-medium text-sm w-full hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400">
            <PlusSquare size={22} strokeWidth={1.8} />
            <span>Create</span>
          </button>
        </nav>

        <div className="space-y-1 border-t border-gray-100 dark:border-gray-800 pt-4">
          <button onClick={toggleTheme}
            className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all font-medium text-sm w-full hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400">
            {isDark ? <Sun size={22} strokeWidth={1.8} /> : <Moon size={22} strokeWidth={1.8} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-3">
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{user?.fullName}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-2 py-2">
        <div className="flex items-center justify-around">
          {[
            { to: "/", icon: Home },
            { to: "/explore", icon: Compass },
            { to: "/reels", icon: Film },
           { to: "/messages", icon: MessageCircle },
{ to: "/groups", icon: Users },
{ to: "/notifications", icon: Bell, badge: unreadCount },
          ].map(({ to, icon: Icon, badge }) => (
            <Link key={to} to={to}
              onClick={() => { if (to === "/notifications") setUnreadCount(0); }}
              className={`p-3 rounded-xl transition-colors relative ${isActive(to) ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
              <Icon size={24} strokeWidth={isActive(to) ? 2.5 : 1.8} />
              {badge > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
          <button onClick={() => setShowCreate(true)} className="p-3 text-gray-400">
            <PlusSquare size={24} strokeWidth={1.8} />
          </button>
          <Link to={`/profile/${user?.username}`}
            className={`p-1 rounded-full ${isActive(`/profile/${user?.username}`) ? "ring-2 ring-gray-900 dark:ring-white" : ""}`}>
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
              className="w-7 h-7 rounded-full object-cover" />
          </Link>
        </div>
      </nav>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
