import { useState, useRef } from "react";
import { X, ImagePlus, ChevronLeft, Loader } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function CreatePostModal({ onClose }) {
  const [step, setStep] = useState("select"); // select | edit | share
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setStep("edit");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setStep("edit");
    }
  };

  const handleShare = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("caption", caption);
      formData.append("location", location);

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared!");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {step !== "select" ? (
            <button onClick={() => setStep(step === "share" ? "edit" : "select")}>
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <h2 className="font-semibold">Create new post</h2>
          {step === "edit" ? (
            <button onClick={() => setStep("share")} className="text-blue-500 font-semibold">
              Next
            </button>
          ) : step === "share" ? (
            <button onClick={handleShare} disabled={isLoading} className="text-blue-500 font-semibold disabled:opacity-50">
              {isLoading ? <Loader size={20} className="animate-spin" /> : "Share"}
            </button>
          ) : (
            <button onClick={onClose}>
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        {step === "select" && (
          <div
            className="flex flex-col items-center justify-center py-16 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={64} className="text-gray-300 mb-4" />
            <p className="text-xl font-light text-gray-600 mb-2">Drag photos here</p>
            <p className="text-gray-400 text-sm mb-6">or click to select from device</p>
            <button className="btn-primary text-sm px-6">Select from computer</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </div>
        )}

        {step === "edit" && preview && (
          <div>
            <img src={preview} alt="Preview" className="w-full object-cover max-h-80" />
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-2">Looks good! Click Next to add details.</p>
            </div>
          </div>
        )}

        {step === "share" && (
          <div className="p-4 space-y-4">
            {preview && (
              <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
            )}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="input-field resize-none h-24"
              maxLength={2200}
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="input-field"
            />
            <p className="text-xs text-gray-400 text-right">{caption.length}/2200</p>
          </div>
        )}
      </div>
    </div>
  );
}
