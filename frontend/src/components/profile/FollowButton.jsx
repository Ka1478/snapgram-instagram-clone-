import { useState } from "react";
import { useAuthStore } from "../../context/authStore";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function FollowButton({ userId, initialFollowing = false, size = "md" }) {
  const { user, getMe } = useAuthStore();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (user?._id === userId) return null;

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/users/${userId}/follow`);
      const nowFollowing = res.data.followed;
      setFollowing(nowFollowing);
      toast.success(nowFollowing ? "Followed!" : "Unfollowed!");
      await getMe();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = size === "sm"
    ? "px-3 py-1 text-xs"
    : size === "lg"
    ? "px-8 py-2.5 text-sm"
    : "px-5 py-1.5 text-sm";

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`${sizeClass} font-semibold rounded-lg transition-colors disabled:opacity-50
        ${following
          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500"
          : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
