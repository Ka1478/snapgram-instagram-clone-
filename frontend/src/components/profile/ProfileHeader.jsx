import { Link } from "react-router-dom";
import { Grid3X3, Bookmark, Tag, Settings, X } from "lucide-react";
import { useState } from "react";
import FollowButton from "./FollowButton";
import { useAuthStore } from "../../context/authStore";
import { useTheme } from "../../context/ThemeContext";

function FollowersModal({ title, users, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden ${isDark ? "bg-neutral-900" : "bg-white"}`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {users?.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No {title.toLowerCase()} yet</p>
          ) : (
            users?.map(u => {
              const id = u._id || u;
              const username = u.username || "user";
              const avatar = u.avatar || `https://ui-avatars.com/api/?name=${u.fullName || username}&background=random`;
              const fullName = u.fullName || "";
              return (
                <Link key={id} to={`/profile/${username}`} onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}>
                  <img src={avatar} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{username}</p>
                    <p className="text-xs text-gray-500">{fullName}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileHeader({ profile, postsCount, activeTab, onTabChange }) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isOwn = user?._id === profile?._id;
  const isFollowing = profile?.followers?.some(f => (typeof f === "object" ? f._id : f) === user?._id);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  return (
    <div className="px-4 pt-4">
      <div className="flex items-start gap-4 md:gap-8 mb-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="snapgram-gradient p-[3px] rounded-full">
            <div className="bg-white dark:bg-black p-[3px] rounded-full">
              <img
                src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=random&size=150`}
                className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h1 className="text-xl font-light">{profile?.username}</h1>
            {isOwn ? (
              <>
                <Link to="/edit-profile" className="px-4 py-1.5 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  Edit profile
                </Link>
                <Link to="/edit-profile">
                  <Settings size={20} className="text-gray-700 dark:text-gray-300" />
                </Link>
              </>
            ) : (
              <FollowButton userId={profile?._id} initialFollowing={isFollowing} />
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-4">
            <div>
              <span className="font-semibold">{postsCount || 0}</span>
              <span className="text-gray-500 ml-1 text-sm">posts</span>
            </div>
            <button onClick={() => setShowFollowers(true)} className="hover:opacity-70 transition-opacity text-left">
              <span className="font-semibold">{profile?.followers?.length || 0}</span>
              <span className="text-gray-500 ml-1 text-sm">followers</span>
            </button>
            <button onClick={() => setShowFollowing(true)} className="hover:opacity-70 transition-opacity text-left">
              <span className="font-semibold">{profile?.following?.length || 0}</span>
              <span className="text-gray-500 ml-1 text-sm">following</span>
            </button>
          </div>

          {/* Bio */}
          <div>
            <p className="font-semibold text-sm">{profile?.fullName}</p>
            {profile?.bio && <p className="text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-1 block">
                {profile.website}
              </a>
            )}
            {profile?.isPrivate && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                🔒 Private account
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        {[
          { id: "posts", icon: Grid3X3, label: "Posts" },
          { id: "saved", icon: Bookmark, label: "Saved" },
          { id: "tagged", icon: Tag, label: "Tagged" },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => onTabChange?.(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider font-semibold border-t-2 transition-colors
              ${activeTab === id ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400"}`}>
            <Icon size={16} />
            <span className="hidden md:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {showFollowers && (
        <FollowersModal title="Followers" users={profile?.followers} onClose={() => setShowFollowers(false)} />
      )}
      {showFollowing && (
        <FollowersModal title="Following" users={profile?.following} onClose={() => setShowFollowing(false)} />
      )}
    </div>
  );
}
