import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../context/authStore";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import PostCard from "../components/post/PostCard";
import StoriesBar from "../components/post/StoriesBar";
import { PostSkeleton, StorySkeleton } from "../components/ui/Skeletons";
import ReelCard from "../components/post/ReelCard";

export default function HomePage() {
  const { user, getMe } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [feed, setFeed] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => { getMe(); }, []);
  useEffect(() => { setStoriesLoading(false); }, []);

  const fetchPage = useCallback(async (p) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const [postsRes, reelsRes] = await Promise.all([
        api.get(`/posts/feed?page=${p}&limit=10`),
        p === 1 ? api.get("/reels") : Promise.resolve({ data: { reels: [] } }),
      ]);
      const newPosts = postsRes.data.posts || [];
      const newReels = p === 1 ? (reelsRes.data.reels || []) : reels;
      if (p === 1) setReels(newReels);
      setPosts(prev => p === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(postsRes.data.hasMore);
      buildFeed(p === 1 ? newPosts : [...posts, ...newPosts], p === 1 ? newReels : reels);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, [posts, reels]);

  const buildFeed = (allPosts, allReels) => {
    const result = [];
    let ri = 0;
    allPosts.forEach((post, i) => {
      result.push({ type: "post", data: post });
      if ((i + 1) % 3 === 0 && ri < allReels.length) {
        result.push({ type: "reel", data: allReels[ri++] });
      }
    });
    setFeed(result);
  };

  useEffect(() => { fetchPage(1); }, []);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage(p => { const next = p + 1; fetchPage(next); return next; });
      }
    }, { threshold: 0.5 });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    observerRef.current = obs;
    return () => obs.disconnect();
  }, [hasMore, loadingMore]);

  return (
    <div className={`min-h-screen ${isDark ? "bg-black" : "bg-gray-50"}`}>
      <div className="max-w-lg mx-auto">
        {/* Stories */}
        <div className={`${isDark ? "bg-black border-b border-gray-800" : "bg-white border-b border-gray-200"}`}>
          {storiesLoading ? <StorySkeleton /> : <StoriesBar />}
        </div>

        {/* Feed */}
        <div className="py-2">
          {loading ? (
            Array.from({length:3}).map((_,i) => <PostSkeleton key={i} />)
          ) : feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Your feed is empty</h3>
              <p className="text-gray-500 text-sm mb-6">Follow people to see their posts here</p>
              <Link to="/explore" className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors">
                Explore Posts
              </Link>
            </div>
          ) : (
            <>
              {feed.map((item, i) =>
                item.type === "post"
                  ? <PostCard key={item.data._id} post={item.data} />
                  : (
                    <div key={`reel-${item.data._id}`} className="mx-auto mb-4 max-w-sm">
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                        <video src={item.data.video} className="w-full aspect-[9/16] object-cover max-h-72" muted loop playsInline
                          onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <Link to="/reels" className="text-white text-sm font-semibold flex items-center gap-2">
                            🎬 <span>Watch Reel</span>
                          </Link>
                          <p className="text-white/80 text-xs truncate">{item.data.caption}</p>
                        </div>
                        <Link to="/reels" className="absolute inset-0" />
                      </div>
                    </div>
                  )
              )}
              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-2">
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasMore && feed.length > 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">You're all caught up! 🎉</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
