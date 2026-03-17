import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../context/authStore";
import { Home, Search, PlusSquare, Bell, User } from "lucide-react";

export default function BottomNav({ onCreatePost }) {
  const { user } = useAuthStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-40 px-2 py-2 safe-bottom">
      <div className="flex items-center justify-around">
        <NavLink to="/" end className={({ isActive }) => `p-2 rounded-xl transition-colors ${isActive ? "text-black dark:text-white" : "text-gray-500"}`}>
          <Home size={24} />
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => `p-2 rounded-xl transition-colors ${isActive ? "text-black dark:text-white" : "text-gray-500"}`}>
          <Search size={24} />
        </NavLink>

        <button onClick={onCreatePost} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
          <PlusSquare size={24} />
        </button>

        <NavLink to="/notifications" className={({ isActive }) => `p-2 rounded-xl transition-colors ${isActive ? "text-black dark:text-white" : "text-gray-500"}`}>
          <Bell size={24} />
        </NavLink>

        <NavLink to={`/profile/${user?.username}`} className={({ isActive }) => `p-2 rounded-xl transition-colors ${isActive ? "text-black dark:text-white" : "text-gray-500"}`}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <User size={24} />
          )}
        </NavLink>
      </div>
    </nav>
  );
}
