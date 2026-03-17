import { useState, useEffect } from "react";
import { BarChart2, Eye, Heart, MessageCircle, Bookmark, Share2, TrendingUp, X } from "lucide-react";
import api from "../../utils/api";

export default function PostAnalytics({ postId, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/hashtags/posts/${postId}/analytics`);
        setAnalytics(res.data.analytics);
      } catch {} finally { setIsLoading(false); }
    };
    fetch();
  }, [postId]);

  const stats = analytics ? [
    { icon: Eye, label: "Views", value: analytics.views, color: "text-blue-500" },
    { icon: TrendingUp, label: "Reach", value: analytics.reach, color: "text-purple-500" },
    { icon: Heart, label: "Likes", value: analytics.likes, color: "text-red-500" },
    { icon: MessageCircle, label: "Comments", value: analytics.comments, color: "text-green-500" },
    { icon: Bookmark, label: "Saves", value: analytics.saves, color: "text-yellow-500" },
    { icon: Share2, label: "Shares", value: analytics.shares, color: "text-orange-500" },
  ] : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" />
            <h2 className="font-bold text-lg">Post Insights</h2>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="snapgram-gradient rounded-xl p-4 mb-4 text-center">
              <p className="text-white text-sm font-medium mb-1">Engagement Rate</p>
              <p className="text-white text-4xl font-bold">{analytics?.engagementRate}%</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="border border-gray-200 dark:border-gray-700 p-3 text-center rounded-xl">
                  <Icon size={20} className={`${color} mx-auto mb-1`} />
                  <p className="font-bold text-lg">{value?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
