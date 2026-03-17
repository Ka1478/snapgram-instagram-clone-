import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import { GridSkeleton } from "../components/ui/Skeletons";

export default function ExplorePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const sentinelRef = useRef(null);
  const searchTimer = useRef(null);

  const fetchPosts = useCallback(async (p) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await api.get(`/posts/explore?page=${p}&limit=18`);
      const newPosts = res.data.posts || [];
      setPosts(prev => p === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 18);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    fetchPosts(1);
    api.get("/reels").then(r => setReels(r.data.reels?.slice(0, 8) || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !search) {
        const next = page + 1;
        setPage(next);
        fetchPosts(next);
      }
    }, { threshold: 0.5 });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, page, search]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setUserResults([]); setPostResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const [users, hashtags] = await Promise.all([
          api.get(`/users/search?q=${val}`),
          api.get(`/hashtags/${encodeURIComponent(val)}`).catch(() => ({ data: { posts: [] } })),
        ]);
        setUserResults(users.data.users || []);
        setPostResults(hashtags.data.posts?.slice(0, 9) || []);
      } catch {}
      finally { setSearchLoading(false); }
    }, 400);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Search bar */}
      <div className={`sticky top-0 z-10 px-4 py-3 ${isDark ? "bg-black border-b border-gray-800" : "bg-white border-b border-gray-100"}`}>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search people, hashtags, keywords..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
          {search && (
            <button onClick={() => { setSearch(""); setUserResults([]); setPostResults([]); }}>
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {search ? (
        <div className="px-4 py-4">
          {searchLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {userResults.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">People</h3>
                  <div className="space-y-1">
                    {userResults.map(u => (
                      <Link key={u._id} to={`/profile/${u.username}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900`}>
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                          className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">{u.username}</p>
                          <p className="text-xs text-gray-500">{u.fullName}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {postResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Posts for <span className="text-blue-500">#{search}</span></h3>
                  <div className="grid grid-cols-3 gap-0.5">
                    {postResults.map(p => (
                      <Link key={p._id} to={`/posts/${p._id}`} className="aspect-square overflow-hidden">
                        <img src={p.image} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {userResults.length === 0 && postResults.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm">No results for "<span className="font-semibold">{search}</span>"</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="pb-4">
          {/* Reels shelf */}
          {reels.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="font-semibold text-sm">Reels</h3>
                <Link to="/reels" className="text-sm text-blue-500 font-medium">See all</Link>
              </div>
              <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
                {reels.map(r => (
                  <Link key={r._id} to="/reels" className="flex-shrink-0 w-28 relative rounded-xl overflow-hidden">
                    <video src={r.video} className="w-28 h-44 object-cover" muted playsInline />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{r.caption || r.author?.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts grid */}
          {loading ? (
            <GridSkeleton count={18} />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-0.5">
                {posts.map(p => (
                  <Link key={p._id} to={`/posts/${p._id}`} className="aspect-square overflow-hidden relative group">
                    <img src={p.image} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" loading="lazy" />
                    {p.comments?.length > 0 && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-3 text-white text-sm font-semibold">
                          <span>❤️ {p.likes?.length || 0}</span>
                          <span>💬 {p.comments?.length || 0}</span>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              <div ref={sentinelRef} className="py-4 flex justify-center">
                {loadingMore && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                {!hasMore && posts.length > 0 && <p className="text-xs text-gray-400">All posts loaded</p>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

