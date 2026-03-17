import { useState, useRef } from "react";
import { X, ImagePlus, ChevronLeft, Loader, Film, UserPlus, Search } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

function TagPeopleModal({ tagged, onAdd, onRemove, onClose }) {
  const [search, setSearch] = useState("");
  const [results, setSearchResults] = useState([]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data.users || []);
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Tag People</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search people to tag..." autoFocus
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none" />
          </div>

          {/* Tagged people */}
          {tagged.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Tagged</p>
              <div className="flex flex-wrap gap-2">
                {tagged.map((u) => (
                  <div key={u._id} className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`} className="w-5 h-5 rounded-full object-cover" />
                    @{u.username}
                    <button onClick={() => onRemove(u._id)} className="ml-1 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.length === 0 && search && (
              <p className="text-center text-gray-400 text-sm py-4">No users found</p>
            )}
            {results.length === 0 && !search && (
              <p className="text-center text-gray-400 text-sm py-4">Search for someone to tag</p>
            )}
            {results.map((u) => {
              const isTagged = tagged.some(t => t._id === u._id);
              return (
                <button key={u._id} onClick={() => isTagged ? onRemove(u._id) : onAdd(u)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                      className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm">{u.username}</p>
                      <p className="text-gray-500 text-xs">{u.fullName}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isTagged ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                    {isTagged && <X size={12} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="w-full btn-primary py-2.5">Done</button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePostModal({ onClose }) {
  const [step, setStep] = useState("select");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReel, setIsReel] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const fileRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (isReel && !file.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (!isReel && !file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setStep("edit");
  };

  const handleShare = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (isReel) {
        formData.append("video", image);
        formData.append("caption", caption);
        await api.post("/reels", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Reel shared! 🎵");
      } else {
        formData.append("image", image);
        formData.append("caption", caption);
        formData.append("location", location);
        formData.append("taggedUsers", JSON.stringify(taggedUsers.map(u => u._id)));
        await api.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Post shared! 📸");
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to share");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (user) => {
    if (taggedUsers.length >= 10) { toast.error("Max 10 people"); return; }
    if (!taggedUsers.some(u => u._id === user._id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
  };

  const removeTag = (userId) => setTaggedUsers(taggedUsers.filter(u => u._id !== userId));

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {step !== "select" ? (
              <button onClick={() => setStep(step === "share" ? "edit" : "select")}>
                <ChevronLeft size={24} />
              </button>
            ) : <div className="w-6" />}
            <h2 className="font-semibold">{isReel ? "Create Reel 🎵" : "Create Post 📸"}</h2>
            {step === "edit" ? (
              <button onClick={() => setStep("share")} className="text-blue-500 font-semibold">Next</button>
            ) : step === "share" ? (
              <button onClick={handleShare} disabled={isLoading} className="text-blue-500 font-semibold disabled:opacity-50 flex items-center gap-1">
                {isLoading ? <Loader size={18} className="animate-spin" /> : "Share"}
              </button>
            ) : (
              <button onClick={onClose}><X size={24} /></button>
            )}
          </div>

          {/* Select Step */}
          {step === "select" && (
            <div>
              <div className="flex gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
                <button onClick={() => { setIsReel(false); setImage(null); setPreview(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${!isReel ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                  <ImagePlus size={16} /> Photo Post
                </button>
                <button onClick={() => { setIsReel(true); setImage(null); setPreview(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isReel ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                  <Film size={16} /> Reel
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-14 cursor-pointer" onClick={() => fileRef.current?.click()}>
                {isReel ? <Film size={64} className="text-gray-300 mb-4" /> : <ImagePlus size={64} className="text-gray-300 mb-4" />}
                <p className="text-xl font-light text-gray-600 mb-2">{isReel ? "Drag video here" : "Drag photos here"}</p>
                <p className="text-gray-400 text-sm mb-6">{isReel ? "MP4, MOV supported" : "JPG, PNG, WEBP supported"}</p>
                <button className="btn-primary text-sm px-6">{isReel ? "Select Video" : "Select Photo"}</button>
                <input ref={fileRef} type="file"
                  accept={isReel ? "video/mp4,video/mov,video/avi,video/webm" : "image/jpeg,image/png,image/webp"}
                  className="hidden" onChange={handleFileSelect} />
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "edit" && preview && (
            <div>
              {isReel
                ? <video src={preview} controls className="w-full max-h-80 object-cover" />
                : <img src={preview} alt="Preview" className="w-full object-cover max-h-80" />
              }
              <div className="p-4">
                <p className="text-sm text-gray-500">{isReel ? "🎵 Looks good! Click Next." : "📸 Looks great! Click Next."}</p>
              </div>
            </div>
          )}

          {/* Share Step */}
          {step === "share" && (
            <div className="p-4 space-y-3">
              {preview && (isReel
                ? <video src={preview} className="w-full h-40 object-cover rounded-xl" muted />
                : <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
              )}
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption... use #hashtags"
                className="input-field resize-none h-24" maxLength={2200} />

              {!isReel && (
                <>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="📍 Add location" className="input-field" />

                  {/* Tag People Button */}
                  <button onClick={() => setShowTagModal(true)}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <UserPlus size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 text-left">
                      {taggedUsers.length > 0 ? `${taggedUsers.length} people tagged` : "Tag people"}
                    </span>
                    {taggedUsers.length > 0 && (
                      <div className="flex -space-x-1">
                        {taggedUsers.slice(0, 3).map(u => (
                          <img key={u._id} src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 object-cover" />
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Tagged users list */}
                  {taggedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {taggedUsers.map(u => (
                        <div key={u._id} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                            className="w-4 h-4 rounded-full object-cover" />
                          @{u.username}
                          <button onClick={() => removeTag(u._id)} className="hover:text-red-500 ml-0.5">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-gray-400 text-right">{caption.length}/2200</p>
            </div>
          )}
        </div>
      </div>

      {showTagModal && (
        <TagPeopleModal
          tagged={taggedUsers}
          onAdd={addTag}
          onRemove={removeTag}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </>
  );
}
