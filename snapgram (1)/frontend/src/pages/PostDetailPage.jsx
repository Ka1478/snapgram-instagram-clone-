import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../utils/api";
import { useAuthStore } from "../context/authStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function PostDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${postId}`);
        setPost(res.data.post);
        setLiked(res.data.post.likes.includes(user?._id));
        setLikesCount(res.data.post.likes.length);
      } catch {
        toast.error("Post not found");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    await api.post(`/posts/${postId}/like`);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { text: comment });
      setPost((prev) => ({ ...prev, comments: [...prev.comments, res.data.comment] }));
      setComment("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
      setPost((prev) => ({ ...prev, comments: prev.comments.filter((c) => c._id !== commentId) }));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      toast.success("Post deleted");
      navigate(`/profile/${user.username}`);
    } catch {
      toast.error("Failed to delete post");
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!post) return null;

  const isOwner = post.author._id === user?._id;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="card overflow-hidden md:flex">
        {/* Image */}
        <div className="md:w-1/2 bg-black flex items-center">
          <img src={post.image} alt={post.caption} className="w-full object-contain max-h-[600px]" />
        </div>

        {/* Details */}
        <div className="md:w-1/2 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
              <img
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=random`}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{post.author.username}</p>
                {post.location && <p className="text-xs text-gray-500">{post.location}</p>}
              </div>
            </Link>
            {isOwner && (
              <button onClick={handleDeletePost} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
            {/* Caption */}
            {post.caption && (
              <div className="flex gap-3">
                <Link to={`/profile/${post.author.username}`}>
                  <img
                    src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=random`}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                </Link>
                <div>
                  <p className="text-sm">
                    <Link to={`/profile/${post.author.username}`} className="font-semibold mr-1">
                      {post.author.username}
                    </Link>
                    {post.caption}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Comments list */}
            {post.comments.map((c) => (
              <div key={c._id} className="flex gap-3 group">
                <Link to={`/profile/${c.user?.username}`}>
                  <img
                    src={c.user?.avatar || `https://ui-avatars.com/api/?name=${c.user?.username}&background=random`}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                </Link>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link to={`/profile/${c.user?.username}`} className="font-semibold mr-1">
                      {c.user?.username}
                    </Link>
                    {c.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {(c.user?._id === user?._id || isOwner) && (
                  <button
                    onClick={() => handleDeleteComment(c._id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={handleLike}>
                <Heart size={24} className={liked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"} />
              </button>
              <MessageCircle size={24} className="text-gray-700 dark:text-gray-300" />
              <Send size={24} className="text-gray-700 dark:text-gray-300" />
              <Bookmark size={24} className="ml-auto text-gray-700 dark:text-gray-300" />
            </div>
            {likesCount > 0 && <p className="text-sm font-semibold mb-1">{likesCount.toLocaleString()} likes</p>}
            <p className="text-xs text-gray-400 uppercase">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>

          {/* Comment input */}
          <form onSubmit={handleComment} className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
            />
            {comment.trim() && (
              <button type="submit" className="text-blue-500 font-semibold text-sm">Post</button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
