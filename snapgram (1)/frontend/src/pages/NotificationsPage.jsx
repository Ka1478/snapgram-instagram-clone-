import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../utils/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useSocket } from "../context/SocketContext";
import FollowButton from "../components/profile/FollowButton";

const NotificationIcon = ({ type }) => {
  const icons = {
    like: <Heart size={20} className="fill-red-500 text-red-500" />,
    comment: <MessageCircle size={20} className="text-blue-500" />,
    follow: <UserPlus size={20} className="text-purple-500" />,
  };
  return icons[type] || null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifRes] = await Promise.all([
          api.get("/notifications"),
          api.put("/notifications/read-all"),
        ]);
        setNotifications(notifRes.data.notifications);
      } catch {} finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    return () => socket.off("notification");
  }, [socket]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-xl font-semibold mb-2">No notifications yet</p>
          <p className="text-gray-500 text-sm">Activity from people who follow you will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 ${
                !notif.read ? "bg-blue-50 dark:bg-blue-950/30" : ""
              }`}
            >
              <Link to={`/profile/${notif.sender?.username}`} className="flex-shrink-0">
                <img
                  src={notif.sender?.avatar || `https://ui-avatars.com/api/?name=${notif.sender?.username}&background=random`}
                  alt={notif.sender?.username}
                  className="w-11 h-11 rounded-full object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link to={`/profile/${notif.sender?.username}`} className="font-semibold">
                    {notif.sender?.username}
                  </Link>{" "}
                  {notif.message?.replace(notif.sender?.username + " ", "")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <NotificationIcon type={notif.type} />
                {notif.type === "follow" && (
                  <FollowButton userId={notif.sender?._id} size="sm" />
                )}
                {notif.post && (
                  <Link to={`/posts/${notif.post._id}`}>
                    <img src={notif.post.image} alt="" className="w-10 h-10 object-cover rounded" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
