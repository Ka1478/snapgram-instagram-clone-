import { useState, useRef } from "react";
import { X, Image, Film, Sparkles, RefreshCw, Check } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import toast from "react-hot-toast";

const STYLES = [
  { key: "casual", label: "😊 Casual", desc: "Fun & relatable" },
  { key: "inspirational", label: "✨ Inspire", desc: "Motivational" },
  { key: "funny", label: "😂 Funny", desc: "Witty & humorous" },
  { key: "professional", label: "💼 Pro", desc: "Business tone" },
  { key: "minimal", label: "🤍 Minimal", desc: "Short & clean" },
];

export default function CreatePostModal({ onClose, onPostCreated }) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tab, setTab] = useState("post");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiStyle, setAiStyle] = useState("casual");
  const [aiIdeas, setAiIdeas] = useState([]);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadedUrl(null);
    setAiIdeas([]);
  };

  const uploadToCloudinary = async () => {
    if (uploadedUrl) return uploadedUrl;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await api.post("/posts/upload-temp", formData);
      setUploadedUrl(res.data.url);
      return res.data.url;
    } catch {
      return null;
    }
  };

  const generateCaption = async () => {
    if (!preview) { toast.error("Upload an image first"); return; }
    setAiLoading(true);
    try {
      const imageUrl = await uploadToCloudinary();
      if (!imageUrl) {
        toast.error("Could not process image for AI");
        return;
      }
      const res = await api.post("/ai/generate-caption", { imageUrl, style: aiStyle });
      setCaption(res.data.caption);
      toast.success("Caption generated!");
      setShowAI(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate caption");
    } finally { setAiLoading(false); }
  };

 const generateIdeas = async () => {
    if (!preview) { toast.error("Upload an image first"); return; }
    setAiLoading(true);
    setAiIdeas([]);
    try {
      const imageUrl = await uploadToCloudinary();
      if (!imageUrl) {
        toast.error("Could not process image for AI");
        return;
      }
      const res = await api.post("/ai/caption-ideas", { imageUrl });
      setAiIdeas(res.data.ideas || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get ideas");
    } finally { setAiLoading(false); }
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Please select an image or video"); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(tab === "post" ? "image" : "video", file);
      formData.append("caption", caption);
      if (location) formData.append("location", location);
      const endpoint = tab === "post" ? "/posts" : "/reels";
      const res = await api.post(endpoint, formData);
      toast.success(tab === "post" ? "Post shared!" : "Reel uploaded!");
      onPostCreated?.(res.data.post || res.data.reel);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-2xl overflow-hidden ${isDark ? "bg-neutral-900" : "bg-white"} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <button onClick={onClose}><X size={22} /></button>
          <div className="flex gap-4">
            {["post", "reel"].map(t => (
              <button key={t} onClick={() => { setTab(t); setFile(null); setPreview(null); }}
                className={`text-sm font-semibold capitalize pb-1 border-b-2 transition-colors ${tab === t ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400"}`}>
                {t === "post" ? "📸 Post" : "🎬 Reel"}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading || !file}
            className="text-blue-500 font-semibold text-sm disabled:opacity-40">
            {loading ? "Sharing..." : "Share"}
          </button>
        </div>

        {/* Upload area */}
        {!preview ? (
          <div className="flex flex-col items-center justify-center py-16 cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <div className="text-5xl mb-3">{tab === "post" ? "📸" : "🎬"}</div>
            <p className="font-semibold text-lg mb-1">
              {tab === "post" ? "Select a photo" : "Select a video"}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {tab === "post" ? "JPG, PNG, WEBP up to 5MB" : "MP4, MOV, WEBM up to 50MB"}
            </p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-semibold">
              Browse files
            </button>
            <input ref={fileRef} type="file"
              accept={tab === "post" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm"}
              onChange={handleFile} className="hidden" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Preview */}
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-64">
              {tab === "post"
                ? <img src={preview} className="max-h-64 w-full object-contain" />
                : <video src={preview} className="max-h-64 w-full" controls />
              }
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Caption</label>
                {tab === "post" && (
                  <button onClick={() => setShowAI(!showAI)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-500 hover:text-purple-600 transition-colors bg-purple-50 dark:bg-purple-950 px-3 py-1.5 rounded-full">
                    <Sparkles size={13} />
                    AI Caption
                  </button>
                )}
              </div>

              {/* AI Panel */}
              {showAI && (
                <div className={`mb-3 p-4 rounded-xl border ${isDark ? "border-purple-800 bg-purple-950/30" : "border-purple-200 bg-purple-50"}`}>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} /> AI Caption Generator
                  </p>

                  {/* Style selector */}
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {STYLES.map(s => (
                      <button key={s.key} onClick={() => setAiStyle(s.key)}
                        className={`p-2 rounded-xl text-center text-xs transition-all ${aiStyle === s.key ? "bg-purple-500 text-white" : isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border border-gray-200"}`}>
                        <div>{s.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={generateCaption} disabled={aiLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                      {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Generate
                    </button>
                    <button onClick={generateIdeas} disabled={aiLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors border ${isDark ? "border-purple-700 text-purple-400" : "border-purple-300 text-purple-600"}`}>
                      {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : "💡"}
                      3 Ideas
                    </button>
                  </div>

                  {/* AI Ideas */}
                  {aiIdeas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {aiIdeas.map((idea, i) => (
                        <div key={i} className={`p-3 rounded-xl cursor-pointer hover:ring-2 ring-purple-400 transition-all ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}
                          onClick={() => { setCaption(idea.caption); setShowAI(false); toast.success("Caption applied!"); }}>
                          <p className="text-xs font-semibold text-purple-500 mb-1">{idea.style}</p>
                          <p className="text-sm">{idea.caption}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <textarea value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Write a caption or use AI to generate one..."
                rows={3} maxLength={2200}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500/20 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`} />
              <p className="text-xs text-gray-400 text-right mt-1">{caption.length}/2200</p>
            </div>

            {/* Location */}
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="📍 Add location (optional)"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`} />

            {/* Change file */}
            <button onClick={() => { setFile(null); setPreview(null); setAiIdeas([]); }}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1">
              Change {tab === "post" ? "photo" : "video"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
