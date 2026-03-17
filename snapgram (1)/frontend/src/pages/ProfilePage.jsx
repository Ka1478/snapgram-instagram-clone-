import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import ProfileHeader from "../components/profile/ProfileHeader";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Heart, MessageCircle } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${username}`);
        setProfile(res.data.user);
      } catch (err) {
        setError(err.response?.data?.message || "User not found");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return (
    <div className="text-center py-16">
      <p className="text-xl font-semibold mb-2">User not found</p>
      <p className="text-gray-500 text-sm">{error}</p>
    </div>
  );

  return (
    <div>
      <ProfileHeader profile={profile} postsCount={profile?.posts?.length} />

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {profile?.posts?.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <div className="text-5xl mb-4">📷</div>
            <h3 className="font-semibold text-xl">No posts yet</h3>
            <p className="text-gray-500 text-sm mt-1">When posts are shared, they'll appear here.</p>
          </div>
        ) : (
          profile?.posts?.map((post) => (
            <Link
              key={post._id}
              to={`/posts/${post._id}`}
              className="relative group aspect-square overflow-hidden"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-white font-semibold text-sm">
                  <Heart size={16} className="fill-white" /> {post.likes?.length || 0}
                </div>
                <div className="flex items-center gap-1 text-white font-semibold text-sm">
                  <MessageCircle size={16} className="fill-white" /> {post.comments?.length || 0}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
