import { Link } from "react-router-dom";
import { Settings, Grid3X3, Bookmark, Tag } from "lucide-react";
import FollowButton from "./FollowButton";
import { useAuthStore } from "../../context/authStore";
import { useState } from "react";

export default function ProfileHeader({ profile, postsCount }) {
  const { user } = useAuthStore();
  const isOwn = user?._id === profile?._id;
  const [activeTab, setActiveTab] = useState("posts");

  const isFollowing = profile?.followers?.some(f => 
    (typeof f === 'object' ? f._id : f) === user?._id
  );

  return (
    <div>
      {/* Profile info */}
      <div className="flex items-start gap-8 mb-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="story-ring p-[3px] rounded-full">
            <div className="bg-white dark:bg-black p-[3px] rounded-full">
              <img
                src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=random&size=150`}
                alt={profile?.username}
                className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="text-xl font-light">{profile?.username}</h1>
            {isOwn ? (
              <Link to="/settings" className="btn-outline text-sm py-1.5 px-4">
                Edit profile
              </Link>
            ) : (
              <FollowButton userId={profile?._id} initialFollowing={isFollowing} />
            )}
            {isOwn && (
              <button className="text-gray-700 dark:text-gray-300">
                <Settings size={20} />
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-4">
            <div className="text-center md:text-left">
              <span className="font-semibold">{postsCount || 0}</span>
              <span className="text-gray-500 ml-1">posts</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile?.followers?.length || 0}</span>
              <span className="text-gray-500 ml-1">followers</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile?.following?.length || 0}</span>
              <span className="text-gray-500 ml-1">following</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="font-semibold text-sm">{profile?.fullName}</p>
            {profile?.bio && <p className="text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-200 dark:border-gray-800">
        {[
          { id: "posts", icon: Grid3X3, label: "Posts" },
          { id: "saved", icon: Bookmark, label: "Saved" },
          { id: "tagged", icon: Tag, label: "Tagged" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider font-semibold border-t-2 transition-colors ${
              activeTab === id
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-400"
            }`}
          >
            <Icon size={16} />
            <span className="hidden md:block">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
