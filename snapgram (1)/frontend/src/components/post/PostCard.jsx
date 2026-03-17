import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../../context/authStore";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.likes.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 300);
      await api.post(`/posts/${post._id}/like`);
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
  };

  const handleSave = async () => {
    try {
      setSaved(!saved);
      await api.post(`/posts/${post._id}/save`);
    } catch {
      setSaved(saved);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text: comment });
      setComments([...comments, res.data.comment]);
      setComment("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  return (
    <article className="card mb-4 animate-fade-in">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <div className="story-ring">
            <div className="bg-white dark:bg-black p-[2px] rounded-full">
              <img
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=random`}
                alt={post.author.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">{post.author.username}</p>
            {post.location && <p className="text-xs text-gray-500">{post.location}</p>}
          </div>
        </Link>
        <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Image */}
      <div className="relative" onDoubleClick={handleDoubleTap}>
        <img
          src={post.image}
          alt={post.caption}
          className="w-full object-cover max-h-[600px]"
          loading="lazy"
        />
        {isLikeAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart size={80} className="text-white fill-white animate-pulse-heart opacity-90" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform active:scale-90">
              <Heart
                size={24}
                className={`transition-colors duration-200 ${liked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"}`}
              />
            </button>
            <Link to={`/posts/${post._id}`}>
              <MessageCircle size={24} className="text-gray-700 dark:text-gray-300" />
            </Link>
            <button>
              <Send size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <button onClick={handleSave}>
            <Bookmark
              size={24}
              className={`transition-colors ${saved ? "fill-gray-900 dark:fill-white text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
            />
          </button>
        </div>

        {/* Likes count */}
        {likesCount > 0 && (
          <p className="text-sm font-semibold mb-1">{likesCount.toLocaleString()} likes</p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-1">
            <Link to={`/profile/${post.author.username}`} className="font-semibold mr-1">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {/* Comments preview */}
        {comments.length > 0 && (
          <Link to={`/posts/${post._id}`} className="text-sm text-gray-500 block mb-1">
            {comments.length > 2 ? `View all ${comments.length} comments` : ""}
          </Link>
        )}

        {comments.slice(-2).map((c) => (
          <p key={c._id} className="text-sm mb-1">
            <Link to={`/profile/${c.user?.username}`} className="font-semibold mr-1">
              {c.user?.username}
            </Link>
            {c.text}
          </p>
        ))}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Comment Input */}
      <div className="flex items-center gap-3 px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <form onSubmit={handleComment} className="flex-1 flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
            maxLength={500}
          />
          {comment.trim() && (
            <button type="submit" className="text-blue-500 font-semibold text-sm hover:text-blue-700">
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
}
