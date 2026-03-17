import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, MessageCircle } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts/explore");
        setPosts(res.data.posts);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(res.data.users);
      } catch {} finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Search Results */}
      {searchQuery ? (
        <div className="space-y-3">
          {isSearching ? (
            <LoadingSpinner size="sm" />
          ) : searchResults.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No results for "{searchQuery}"</p>
          ) : (
            searchResults.map((user) => (
              <Link key={user._id} to={`/profile/${user.username}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{user.username}</p>
                  <p className="text-gray-500 text-sm">{user.fullName}</p>
                  <p className="text-gray-400 text-xs">{user.followers?.length || 0} followers</p>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        /* Explore Grid */
        isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post, i) => (
              <Link
                key={post._id}
                to={`/posts/${post._id}`}
                className={`relative group overflow-hidden aspect-square ${
                  i % 7 === 0 ? "col-span-2 row-span-2" : ""
                }`}
              >
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Heart size={20} className="fill-white" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <MessageCircle size={20} className="fill-white" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
