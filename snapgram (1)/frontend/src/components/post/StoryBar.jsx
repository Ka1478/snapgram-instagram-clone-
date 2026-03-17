import { Link } from "react-router-dom";
import { useAuthStore } from "../../context/authStore";
import { PlusCircle } from "lucide-react";

export default function StoryBar({ users = [] }) {
  const { user } = useAuthStore();

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
      {/* Your story */}
      <Link to={`/profile/${user?.username}`} className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="relative">
          <div className="story-ring p-[2px] rounded-full">
            <div className="bg-white dark:bg-black p-[2px] rounded-full">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
                alt="Your story"
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-2 border-white dark:border-black">
            <PlusCircle size={16} className="text-white" />
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-16 text-center">Your story</span>
      </Link>

      {/* Following stories */}
      {users.map((u) => (
        <Link key={u._id} to={`/profile/${u.username}`} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="story-ring p-[2px] rounded-full">
            <div className="bg-white dark:bg-black p-[2px] rounded-full">
              <img
                src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                alt={u.username}
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-16 text-center">{u.username}</span>
        </Link>
      ))}
    </div>
  );
}
