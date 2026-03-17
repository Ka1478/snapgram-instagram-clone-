import { useState, useEffect, useRef } from "react";
import { Plus, X, Send } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function StoriesBar() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [stories, setStories] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [viewingIdx, setViewingIdx] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    api.get("/stories").then(r => setStories(r.data.stories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    const story = viewing.stories[storyIdx];
    if (story) api.post(`/stories/${story._id}/view`).catch(() => {});
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          nextStory();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [viewing, storyIdx]);

  const openStory = (group, idx) => {
    setViewing(group);
    setViewingIdx(idx);
    setStoryIdx(0);
  };

  const nextStory = () => {
    if (storyIdx < viewing.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (viewingIdx < stories.length - 1) {
      setViewing(stories[viewingIdx + 1]);
      setViewingIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (storyIdx > 0) setStoryIdx(i => i - 1);
    else if (viewingIdx > 0) {
      setViewing(stories[viewingIdx - 1]);
      setViewingIdx(i => i - 1);
      setStoryIdx(stories[viewingIdx - 1].stories.length - 1);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !viewing) return;
    const story = viewing.stories[storyIdx];
    try {
      await api.post(`/stories/${story._id}/reply`, { text: reply });
      toast.success("Reply sent!");
      setReply("");
    } catch { toast.error("Failed to send reply"); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    try {
      const r = await api.post("/stories", formData);
      const myGroup = stories.find(g => g.author._id === user._id);
      if (myGroup) {
        setStories(prev => prev.map(g => g.author._id === user._id ? { ...g, stories: [r.data.story, ...g.stories] } : g));
      } else {
        setStories(prev => [{ author: user, stories: [r.data.story] }, ...prev]);
      }
      toast.success("Story posted!");
    } catch { toast.error("Failed to post story"); }
  };

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Add Story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <label className="cursor-pointer">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-900">
              <Plus size={22} className="text-gray-400" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <span className="text-xs text-gray-500 truncate w-16 text-center">Your story</span>
        </div>

        {/* Story groups */}
        {stories.map((group, idx) => {
          const hasUnviewed = group.stories.some(s => !s.viewers?.some(v => (v._id || v) === user?._id));
          return (
            <div key={group.author._id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => openStory(group, idx)}>
              <div className={`w-16 h-16 rounded-full p-[2px] ${hasUnviewed ? "snapgram-gradient" : "bg-gray-300 dark:bg-gray-600"}`}>
                <div className="w-full h-full rounded-full border-2 border-white dark:border-black overflow-hidden">
                  <img src={group.author.avatar || `https://ui-avatars.com/api/?name=${group.author.fullName}&background=random`}
                    className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-xs truncate w-16 text-center">{group.author.username}</span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer */}
      {viewing && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full max-w-sm h-full md:h-[90vh] md:max-h-[700px]">
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
              {viewing.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-none"
                    style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-7 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={viewing.author.avatar || `https://ui-avatars.com/api/?name=${viewing.author.fullName}&background=random`}
                  className="w-8 h-8 rounded-full object-cover border border-white/50" />
                <span className="text-white text-sm font-semibold">{viewing.author.username}</span>
              </div>
              <button onClick={() => setViewing(null)} className="text-white p-1"><X size={22} /></button>
            </div>

            {/* Story image */}
            <img src={viewing.stories[storyIdx]?.media} className="w-full h-full object-cover" />

            {/* Caption */}
            {viewing.stories[storyIdx]?.caption && (
              <div className="absolute bottom-20 left-0 right-0 text-center px-4">
                <p className="text-white text-sm bg-black/40 rounded-lg px-3 py-2 inline-block">{viewing.stories[storyIdx].caption}</p>
              </div>
            )}

            {/* Nav areas */}
            <div className="absolute inset-0 flex" style={{ bottom: "80px" }}>
              <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
              <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
            </div>

            {/* Reply bar */}
            {viewing.author._id !== user?._id && (
              <div className="absolute bottom-4 left-3 right-3 flex items-center gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)}
                  placeholder={`Reply to ${viewing.author.username}...`}
                  className="flex-1 bg-transparent border border-white/60 text-white placeholder-white/60 rounded-full px-4 py-2.5 text-sm outline-none"
                  onKeyDown={e => e.key === "Enter" && sendReply()} />
                {reply.trim() && (
                  <button onClick={sendReply} className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Send size={16} className="text-white" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
