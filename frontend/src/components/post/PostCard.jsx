import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BarChart2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../../context/authStore";
import api from "../../utils/api";
import toast from "react-hot-toast";
import EmojiReactions from "./EmojiReactions";
import PostAnalytics from "./PostAnalytics";

function ShareModal({ post, onClose }) {
  const [search, setSearch] = useState("");
  const [results, setSearchResults] = useState([]);
  const [sent, setSent] = useState([]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data.users || []);
    } catch {}
  };

  const handleSend = async (userId) => {
    try {
      await api.post(`/messages/${userId}`, { text: `Check out this post: ${window.location.origin}/posts/${post._id}` });
      setSent(prev => [...prev, userId]);
      toast.success("Post shared!");
    } catch { toast.error("Failed to share"); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Share Post</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4">
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none mb-3"
            autoFocus />
          {results.length === 0 && !search && (
            <p className="text-center text-gray-400 text-sm py-4">Search for someone to share with</p>
          )}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {results.map(u => (
              <div key={u._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                    className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-sm">{u.username}</p>
                    <p className="text-gray-500 text-xs">{u.fullName}</p>
                  </div>
                </div>
                <button onClick={() => handleSend(u._id)} disabled={sent.includes(u._id)}
                  className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors ${sent.includes(u._id) ? "bg-gray-100 dark:bg-gray-700 text-gray-400" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
                  {sent.includes(u._id) ? "Sent ✓" : "Send"}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post._id}`); toast.success("Link copied!"); }}
            className="w-full border border-gray-200 dark:border-gray-700 text-sm py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium">
            🔗 Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({ post }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(user?.saved?.includes(post._id));
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const isOwner = post.author?._id === user?._id;

  const handleLike = async () => {
    setLiked(l => !l);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try { await api.post(`/posts/${post._id}/like`); }
    catch { setLiked(l => !l); setLikesCount(c => liked ? c + 1 : c - 1); }
  };

  const handleSave = async () => {
    setSaved(s => !s);
    try { await api.post(`/posts/${post._id}/save`); }
    catch { setSaved(s => !s); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text: comment });
      setComments(prev => [...prev, res.data.comment]);
      setComment("");
    } catch { toast.error("Failed to add comment"); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted!");
      window.location.reload();
    } catch { toast.error("Failed to delete"); }
  };

  const renderCaption = (caption) => {
    if (!caption) return null;
    return caption.split(/(#[\w]+)/g).map((part, i) =>
      part.startsWith("#")
        ? <Link key={i} to={`/hashtag/${part.slice(1)}`} className="text-blue-500 hover:underline">{part}</Link>
        : part
    );
  };

  return (
    <article className="bg-white dark:bg-neutral-900 md:rounded-xl md:border border-gray-200 dark:border-gray-800 mb-2 md:mb-4">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-3">
          <div className="snapgram-gradient p-[2px] rounded-full">
            <div className="bg-white dark:bg-black p-[2px] rounded-full">
              <img src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.fullName}&background=random`}
                className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">{post.author?.username}</p>
            {post.location && <p className="text-xs text-gray-500">📍 {post.location}</p>}
          </div>
        </Link>
        <div className="relative">
          <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-500">
            <MoreHorizontal size={20} />
          </button>
          {showOptions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
              <div className="absolute right-0 top-8 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 min-w-36 overflow-hidden">
                <button onClick={() => { navigate(`/posts/${post._id}`); setShowOptions(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  💬 View Post
                </button>
                {isOwner && (
                  <button onClick={() => { setShowAnalytics(true); setShowOptions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    <BarChart2 size={16} /> Analytics
                  </button>
                )}
                <button onClick={() => { setShowShare(true); setShowOptions(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Send size={16} /> Share
                </button>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${post._id}`); toast.success("Link copied!"); setShowOptions(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  🔗 Copy Link
                </button>
                {isOwner && (
                  <button onClick={() => { handleDelete(); setShowOptions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                    🗑️ Delete Post
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image — click to open post detail */}
      <div onDoubleClick={handleLike} onClick={() => navigate(`/posts/${post._id}`)} className="cursor-pointer">
        <img src={post.image} alt={post.caption}
          className="w-full object-cover max-h-[500px] md:max-h-[600px]" loading="lazy" />
      </div>

      {/* Actions */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <EmojiReactions postId={post._id} initialLiked={liked} onLikeToggle={handleLike} />
            <button onClick={() => navigate(`/posts/${post._id}`)}>
              <MessageCircle size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button onClick={() => setShowShare(true)}>
              <Send size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <button onClick={handleSave}>
            <Bookmark size={24} className={saved ? "fill-gray-900 dark:fill-white text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"} />
          </button>
        </div>

        {likesCount > 0 && <p className="text-sm font-semibold mb-1">{likesCount.toLocaleString()} likes</p>}

        {/* Tagged Users */}
        {post.taggedUsers?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-1">
            <span className="text-xs text-gray-500">with</span>
            {post.taggedUsers.map((u, i) => (
              <Link key={u._id} to={`/profile/${u.username}`}
                className="text-xs font-semibold text-blue-500 hover:underline">
                @{u.username}{i < post.taggedUsers.length - 1 ? "," : ""}
              </Link>
            ))}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-1">
            <Link to={`/profile/${post.author?.username}`} className="font-semibold mr-1">{post.author?.username}</Link>
            {renderCaption(post.caption)}
          </p>
        )}

        {/* Comments preview */}
        {comments.length > 2 && (
          <button onClick={() => navigate(`/posts/${post._id}`)} className="text-sm text-gray-500 block mb-1">
            View all {comments.length} comments
          </button>
        )}
        {comments.slice(-2).map(c => (
          <p key={c._id} className="text-sm mb-0.5">
            <Link to={`/profile/${c.user?.username}`} className="font-semibold mr-1">{c.user?.username}</Link>
            {c.text}
          </p>
        ))}

        <p className="text-xs text-gray-400 uppercase tracking-wide mt-1 mb-2">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Comment Input */}
      <div className="flex items-center gap-3 px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
        <form onSubmit={handleComment} className="flex-1 flex gap-2">
          <input type="text" value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..." className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 min-w-0" maxLength={500} />
          {comment.trim() && (
            <button type="submit" className="text-blue-500 font-semibold text-sm flex-shrink-0">Post</button>
          )}
        </form>
      </div>

      {showAnalytics && <PostAnalytics postId={post._id} onClose={() => setShowAnalytics(false)} />}
      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
    </article>
  );
}
