import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, Send, ArrowLeft, Trash2, Edit2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../context/authStore";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function PostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/posts/${postId}`);
        setPost(res.data.post);
        setLiked(res.data.post.likes?.some(l => (l._id || l) === user?._id));
        setSaved(user?.saved?.includes(postId));
        setEditCaption(res.data.post.caption || "");
      } catch { toast.error("Post not found"); navigate("/"); }
      finally { setLoading(false); }
    };
    fetch();
  }, [postId]);

  const handleLike = async () => {
    setLiked(l => !l);
    setPost(p => ({ ...p, likes: liked ? p.likes.filter(l => (l._id||l) !== user._id) : [...p.likes, user._id] }));
    await api.post(`/posts/${postId}/like`).catch(() => setLiked(l => !l));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { text: comment });
      setPost(p => ({ ...p, comments: [...p.comments, res.data.comment] }));
      setComment("");
    } catch { toast.error("Failed to post comment"); }
  };

  const handleDeleteComment = async (cId) => {
    try {
      await api.delete(`/posts/${postId}/comments/${cId}`);
      setPost(p => ({ ...p, comments: p.comments.filter(c => c._id !== cId) }));
    } catch { toast.error("Failed to delete"); }
  };

  const handleSave = async () => {
    setSaved(s => !s);
    await api.post(`/posts/${postId}/save`).catch(() => setSaved(s => !s));
  };

  const handleEdit = async () => {
    try {
      const res = await api.put(`/posts/${postId}`, { caption: editCaption });
      setPost(res.data.post);
      setEditing(false);
      toast.success("Caption updated!");
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      toast.success("Post deleted");
      navigate(-1);
    } catch { toast.error("Failed to delete"); }
  };

  const renderCaption = (cap) => {
    if (!cap) return null;
    return cap.split(/(#[\w]+)/g).map((p, i) =>
      p.startsWith("#")
        ? <Link key={i} to={`/hashtag/${p.slice(1)}`} className="text-blue-500 hover:underline">{p}</Link>
        : p
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!post) return null;

  const isOwner = post.author?._id === user?._id;

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg">Post</h1>
        </div>

        <div className={`flex flex-col md:flex-row ${isDark ? "bg-black" : "bg-white"} md:rounded-xl md:border border-gray-200 dark:border-gray-800 md:m-4 overflow-hidden`}>
          {/* Image */}
          <div className="md:w-3/5 bg-black flex items-center justify-center">
            <img src={post.image} alt={post.caption} className="w-full max-h-[600px] object-contain" />
          </div>

          {/* Right Panel */}
          <div className="md:w-2/5 flex flex-col border-l border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-3">
                <img src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.fullName}&background=random`}
                  className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">{post.author?.username}</p>
                  {post.location && <p className="text-xs text-gray-500">📍 {post.location}</p>}
                </div>
              </Link>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={handleDelete} className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              {editing ? (
                <div className="space-y-2">
                  <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)}
                    className="w-full text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-2 resize-none outline-none" rows={3} />
                  <div className="flex gap-2">
                    <button onClick={handleEdit} className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1.5 rounded-lg">
                      <Check size={14} /> Save
                    </button>
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">
                  <Link to={`/profile/${post.author?.username}`} className="font-semibold mr-2">{post.author?.username}</Link>
                  {renderCaption(post.caption)}
                </p>
              )}
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72">
              {post.comments.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No comments yet. Be the first!</p>
              )}
              {post.comments.map(c => (
                <div key={c._id} className="flex items-start gap-2 group">
                  <Link to={`/profile/${c.user?.username}`}>
                    <img src={c.user?.avatar || `https://ui-avatars.com/api/?name=${c.user?.fullName}&background=random`}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  </Link>
                  <div className="flex-1">
                    <span className="font-semibold text-sm mr-2">{c.user?.username}</span>
                    <span className="text-sm">{c.text}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                  </div>
                  {(c.user?._id === user?._id || isOwner) && (
                    <button onClick={() => handleDeleteComment(c._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <button onClick={handleLike}>
                    <Heart size={24} className={liked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"} />
                  </button>
                  <MessageCircle size={24} className="text-gray-700 dark:text-gray-300" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`); toast.success("Link copied!"); }}>
                    <Send size={24} className="text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
                <button onClick={handleSave}>
                  <Bookmark size={24} className={saved ? "fill-gray-900 dark:fill-white" : "text-gray-700 dark:text-gray-300"} />
                </button>
              </div>
              <p className="text-sm font-semibold mb-1">{post.likes?.length || 0} likes</p>
              <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
              <form onSubmit={handleComment} className="flex items-center gap-2">
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                <input value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..." maxLength={500}
                  className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400" />
                {comment.trim() && (
                  <button type="submit" className="text-blue-500 font-semibold text-sm">Post</button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
