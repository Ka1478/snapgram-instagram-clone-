import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../context/authStore";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function ReelsPage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const videoRefs = useRef({});

  useEffect(() => {
    api.get("/reels").then(r => setReels(r.data.reels || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) { video.play().catch(() => {}); }
        else { video.pause(); video.currentTime = 0; }
      });
    }, { threshold: 0.7 });
    Object.values(videoRefs.current).forEach(v => v && observer.observe(v));
    return () => observer.disconnect();
  }, [reels]);

  const handleLike = async (reelId) => {
    setReels(prev => prev.map(r => {
      if (r._id !== reelId) return r;
      const liked = r.likes?.includes(user._id);
      return { ...r, likes: liked ? r.likes.filter(id => id !== user._id) : [...(r.likes||[]), user._id] };
    }));
    await api.post(`/reels/${reelId}/like`).catch(() => {});
  };

  const handleDelete = async (reelId) => {
    if (!confirm("Delete this reel?")) return;
    try {
      await api.delete(`/reels/${reelId}`);
      setReels(prev => prev.filter(r => r._id !== reelId));
      toast.success("Reel deleted!");
    } catch { toast.error("Failed to delete"); }
  };

  const handleShare = (reelId) => {
    navigator.clipboard.writeText(`${window.location.origin}/reels`);
    toast.success("Link copied!");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (reels.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-400">
      <div className="text-5xl mb-3">🎬</div>
      <p className="font-semibold text-lg">No reels yet</p>
      <p className="text-sm mt-1">Be the first to upload a reel!</p>
    </div>
  );

  return (
    <div className={`h-screen overflow-y-scroll snap-y snap-mandatory ${isDark ? "bg-black" : "bg-black"}`}
      style={{ scrollbarWidth: "none" }}>
      {reels.map(reel => {
        const liked = reel.likes?.includes(user?._id);
        const isOwner = reel.author?._id === user?._id;
        return (
          <div key={reel._id} className="h-screen w-full snap-start flex items-center justify-center relative">
            {/* Video container — mobile sized, centered */}
            <div className="relative bg-black overflow-hidden rounded-none md:rounded-2xl"
              style={{ width: "min(420px, 100vw)", height: "min(780px, 100vh)", maxHeight: "100vh" }}>

              {/* Video */}
              <video
                ref={el => videoRefs.current[reel._id] = el}
                src={reel.video}
                className="w-full h-full object-cover"
                loop playsInline muted={muted}
                onClick={e => { e.target.paused ? e.target.play() : e.target.pause(); }}
              />

              {/* Top controls */}
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setMuted(m => !m)}
                  className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {muted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
                </button>
              </div>

              {/* Right action buttons */}
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
                <button onClick={() => handleLike(reel._id)} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Heart size={22} className={liked ? "fill-red-500 text-red-500" : "text-white"} />
                  </div>
                  <span className="text-white text-xs font-medium">{reel.likes?.length || 0}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <MessageCircle size={22} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">{reel.comments?.length || 0}</span>
                </button>

                <button onClick={() => handleShare(reel._id)} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Share2 size={22} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">Share</span>
                </button>

                {isOwner && (
                  <button onClick={() => handleDelete(reel._id)} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Trash2 size={20} className="text-red-400" />
                    </div>
                  </button>
                )}
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10">
                <Link to={`/profile/${reel.author?.username}`} className="flex items-center gap-2 mb-2">
                  <img src={reel.author?.avatar || `https://ui-avatars.com/api/?name=${reel.author?.fullName}&background=random`}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/60" />
                  <span className="text-white font-semibold text-sm">@{reel.author?.username}</span>
                </Link>
                {reel.caption && (
                  <p className="text-white text-sm mb-2 leading-relaxed">{reel.caption}</p>
                )}
                {reel.audio && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-xs">🎵 {reel.audio}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
