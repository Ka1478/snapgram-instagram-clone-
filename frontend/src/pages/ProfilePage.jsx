import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../context/authStore";
import { useTheme } from "../context/ThemeContext";
import ProfileHeader from "../components/profile/ProfileHeader";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { GridSkeleton } from "../components/ui/Skeletons";
import { Grid3X3, Bookmark, Tag } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.username === username;

  useEffect(() => {
    setLoading(true);
    setActiveTab("posts");
    setSavedPosts([]);
    setTaggedPosts([]);
    api.get(`/users/${username}`)
      .then(res => {
        setProfile(res.data.user);
        setPosts(res.data.posts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    if (activeTab === "saved" && isOwnProfile && savedPosts.length === 0) {
      api.get("/posts/saved").then(res => setSavedPosts(res.data.posts || [])).catch(() => {});
    }
    if (activeTab === "tagged" && taggedPosts.length === 0) {
      api.get(`/posts/tagged/${profile._id}`).then(res => setTaggedPosts(res.data.posts || [])).catch(() => {});
    }
  }, [activeTab, profile]);

  const displayPosts = activeTab === "posts" ? posts : activeTab === "saved" ? savedPosts : taggedPosts;

  const emptyMessages = {
    posts:  { title: "No posts yet",        subtitle: "When posts are shared, they will appear here." },
    saved:  { title: "No saved posts yet",  subtitle: isOwnProfile ? "Tap the bookmark on any post to save it here." : "Only the account owner can see saved posts." },
    tagged: { title: "No tagged posts",     subtitle: "Posts where you are tagged will appear here." },
  };

  if (loading) return (
    <div className={`min-h-screen ${isDark ? "bg-black" : "bg-white"}`}>
      <GridSkeleton count={9} />
    </div>
  );

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400">
      <p>User not found</p>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-white text-gray-900"}`}>
      {/* Profile Header */}
      <ProfileHeader profile={profile} postsCount={posts.length} />

      {/* Tabs */}
      <div className={`flex border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        {[
          { key: "posts",  icon: <Grid3X3 size={18} />,  label: "Posts" },
          ...(isOwnProfile ? [{ key: "saved", icon: <Bookmark size={18} />, label: "Saved" }] : []),
          { key: "tagged", icon: <Tag size={18} />, label: "Tagged" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-t-2 transition-colors ${
              activeTab === tab.key
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {displayPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="text-5xl mb-3">
            {activeTab === "posts" ? "📷" : activeTab === "saved" ? "🔖" : "🏷️"}
          </div>
          <p className="font-semibold text-base">{emptyMessages[activeTab].title}</p>
          <p className="text-sm mt-1 text-center px-8">{emptyMessages[activeTab].subtitle}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {displayPosts.map(post => (
            <Link key={post._id} to={`/posts/${post._id}`}
              className="aspect-square overflow-hidden relative group">
              <img src={post.image} alt={post.caption}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-3 text-white text-sm font-semibold drop-shadow">
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
