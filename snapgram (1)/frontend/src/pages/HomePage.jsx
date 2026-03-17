import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import PostCard from "../components/post/PostCard";
import StoryBar from "../components/post/StoryBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SuggestedUsers from "../components/profile/SuggestedUsers";
import { useAuthStore } from "../context/authStore";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const { user } = useAuthStore();

  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/posts/feed?page=${pageNum}`);
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts((prev) => [...prev, ...res.data.posts]);
      }
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await api.get("/users/suggested");
        setSuggestedUsers(res.data.users);
      } catch {}
    };
    fetchSuggested();
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  return (
    <div className="flex gap-8">
      {/* Feed */}
      <div className="flex-1 max-w-[470px] mx-auto">
        <StoryBar users={suggestedUsers.slice(0, 6)} />

        {isLoading && page === 1 ? (
          <LoadingSpinner />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-semibold mb-2">Start following people</h2>
            <p className="text-gray-500 text-sm">
              When you follow people, you'll see the photos and videos they post here.
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="text-blue-500 font-semibold text-sm"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar - suggested */}
      <div className="hidden xl:block w-80 flex-shrink-0">
        <div className="sticky top-6">
          {/* Current user */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
              alt=""
              className="w-11 h-11 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{user?.username}</p>
              <p className="text-gray-500 text-sm truncate">{user?.fullName}</p>
            </div>
            <button className="text-blue-500 text-xs font-semibold hover:text-blue-700">Switch</button>
          </div>

          {suggestedUsers.length > 0 && (
            <SuggestedUsers users={suggestedUsers} />
          )}

          <p className="text-xs text-gray-400 mt-6">
            © 2024 SNAPGRAM FROM YOUR COMPANY
          </p>
        </div>
      </div>
    </div>
  );
}
