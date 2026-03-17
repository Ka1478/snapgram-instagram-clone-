import { useState } from "react";
import api from "../../utils/api";
import { useAuthStore } from "../../context/authStore";
import toast from "react-hot-toast";

export default function FollowButton({ userId, initialFollowing = false, size = "md", onFollowChange }) {
  const { user, updateUser } = useAuthStore();
  const [following, setFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  if (userId === user?._id) return null;

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const res = await api.post(`/users/${userId}/follow`);
      setFollowing(res.data.following);
      if (onFollowChange) onFollowChange(res.data.following);
    } catch {
      toast.error("Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-6 py-2 text-base",
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`${sizeClasses[size]} rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 ${
        following
          ? "border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 hover:border-red-300"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {isLoading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
