import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Hash, Heart, MessageCircle } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function HashtagPage() {
  const { tag } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHashtag = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/hashtags/${tag}`);
        setData(res.data);
      } catch {} finally {
        setIsLoading(false);
      }
    };
    fetchHashtag();
  }, [tag]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 p-4 card">
        <div className="w-16 h-16 snapgram-gradient rounded-full flex items-center justify-center">
          <Hash size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">#{data?.hashtag}</h1>
          <p className="text-gray-500 text-sm">{data?.total || 0} posts</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {data?.posts?.map((post) => (
          <Link key={post._id} to={`/posts/${post._id}`} className="relative group aspect-square overflow-hidden">
            <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white font-semibold text-sm">
                <Heart size={16} className="fill-white" /> {post.likes?.length || 0}
              </div>
              <div className="flex items-center gap-1 text-white font-semibold text-sm">
                <MessageCircle size={16} className="fill-white" /> {post.comments?.length || 0}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
