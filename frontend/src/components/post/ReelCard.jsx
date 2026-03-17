import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import api from "../../utils/api";

export default function ReelCard({ reel }) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(reel.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);

  const handleLike = async () => {
    setLiked(l => !l);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try { await api.post(`/reels/${reel._id}/like`); }
    catch { setLiked(l => !l); setLikesCount(c => liked ? c + 1 : c - 1); }
  };

  return (
    <div className="mx-auto mb-4 max-w-sm">
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <video src={reel.video} className="w-full aspect-[9/16] object-cover max-h-72" muted loop playsInline
          onMouseEnter={e => e.target.play()}
          onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <Link to={`/profile/${reel.author?.username}`} className="flex items-center gap-2 mb-1">
            <img src={reel.author?.avatar || `https://ui-avatars.com/api/?name=${reel.author?.fullName}&background=random`}
              className="w-6 h-6 rounded-full object-cover border border-white/50" />
            <span className="text-white text-sm font-semibold">{reel.author?.username}</span>
          </Link>
          {reel.caption && <p className="text-white/80 text-xs truncate">{reel.caption}</p>}
        </div>
        <div className="absolute right-3 bottom-16 flex flex-col items-center gap-3">
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
            <Heart size={22} className={liked ? "fill-red-500 text-red-500" : "text-white"} />
            <span className="text-white text-xs">{likesCount}</span>
          </button>
          <Link to="/reels" className="flex flex-col items-center gap-0.5">
            <MessageCircle size={22} className="text-white" />
            <span className="text-white text-xs">{reel.comments?.length || 0}</span>
          </Link>
        </div>
        <Link to="/reels" className="absolute inset-0" />
      </div>
    </div>
  );
}
