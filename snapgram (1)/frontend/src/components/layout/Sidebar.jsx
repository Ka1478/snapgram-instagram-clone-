import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../context/authStore";
import { useTheme } from "../../context/ThemeContext";
import {
  Home, Search, Compass, Film, MessageCircle, Bell, PlusSquare,
  User, Sun, Moon, LogOut, Camera
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../utils/api";

export default function Sidebar({ onCreatePost }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.get("/notifications/unread/count");
        setUnreadNotifications(res.data.count);
      } catch {}
    };
    fetchCounts();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home", exact: true },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
    { to: "/notifications", icon: Bell, label: "Notifications", badge: unreadNotifications },
    { to: `/profile/${user?.username}`, icon: User, label: "Profile" },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 xl:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black z-40 p-4">
      {/* Logo */}
      <div className="px-2 py-6 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 snapgram-gradient rounded-lg flex items-center justify-center">
            <Camera size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight snapgram-gradient-text">Snapgram</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label, exact, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <div className="relative">
              <Icon size={24} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className="text-sm xl:text-base">{label}</span>
          </NavLink>
        ))}

        {/* Create Post */}
        <button onClick={onCreatePost} className="sidebar-link w-full text-left">
          <PlusSquare size={24} />
          <span className="text-sm xl:text-base">Create</span>
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 border-t border-gray-200 dark:border-gray-800 pt-4">
        <button onClick={toggleTheme} className="sidebar-link w-full text-left">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <NavLink to={`/profile/${user?.username}`} className="sidebar-link">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
            alt={user?.username}
            className="w-7 h-7 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.fullName}</p>
          </div>
        </NavLink>

        <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
          <LogOut size={20} />
          <span className="text-sm">Log out</span>
        </button>
      </div>
    </aside>
  );
}
