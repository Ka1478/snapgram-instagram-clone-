import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../context/authStore";
import { useTheme } from "../context/ThemeContext";
import { Camera, Lock, Globe, User, Eye, EyeOff, Trash2 } from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user?.fullName || "", bio: user?.bio || "", website: user?.website || "", isPrivate: user?.isPrivate || false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const handleAvatarChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (passwords.new && passwords.new !== passwords.confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append("fullName", form.fullName);
    formData.append("bio", form.bio);
    formData.append("website", form.website);
    formData.append("isPrivate", form.isPrivate);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (passwords.new && passwords.current) { formData.append("currentPassword", passwords.current); formData.append("newPassword", passwords.new); }
    try {
      const res = await api.put("/users/profile/update", formData);
      updateUser(res.data.user);
      toast.success("Profile updated!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update"); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) { toast.error("Enter your password to confirm"); return; }
    try {
      await api.delete("/users/account/delete", { data: { password: deleteConfirm } });
      toast.success("Account deleted");
      await logout();
      navigate("/login");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="font-semibold">{user?.username}</p>
            <p className="text-sm text-gray-500">Click camera to change photo</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`} />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} maxLength={150} rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`} />
            <p className="text-xs text-gray-400 text-right mt-1">{form.bio.length}/150</p>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Website</label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))}
                placeholder="https://yoursite.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`} />
            </div>
          </div>

          {/* Private Account Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-gray-500" />
              <div>
                <p className="font-medium text-sm">Private Account</p>
                <p className="text-xs text-gray-500">Only followers can see your posts</p>
              </div>
            </div>
            <button type="button" onClick={() => setForm(f => ({...f, isPrivate: !f.isPrivate}))}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.isPrivate ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isPrivate ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Change Password */}
          <div className={`p-4 rounded-xl border ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"} space-y-3`}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm flex items-center gap-2"><Lock size={16} /> Change Password</p>
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs text-blue-500">{showPw ? "Hide" : "Show"}</button>
            </div>
            {showPw && (
              <div className="space-y-3">
                {["current", "new", "confirm"].map(f => (
                  <input key={f} type="password" value={passwords[f]} placeholder={f === "current" ? "Current password" : f === "new" ? "New password" : "Confirm new password"}
                    onChange={e => setPasswords(p => ({...p, [f]: e.target.value}))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"}`} />
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Danger Zone */}
        <div className={`mt-8 p-4 rounded-xl border border-red-200 dark:border-red-900 ${isDark ? "bg-red-950/30" : "bg-red-50"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-red-500" />
              <p className="font-medium text-sm text-red-600 dark:text-red-400">Delete Account</p>
            </div>
            <button type="button" onClick={() => setShowDelete(!showDelete)} className="text-xs text-red-500 underline">
              {showDelete ? "Cancel" : "I want to delete"}
            </button>
          </div>
          {showDelete && (
            <div className="space-y-3">
              <p className="text-xs text-red-500">This is permanent. All your posts, reels, and data will be deleted forever.</p>
              <input type="password" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Enter password to confirm"
                className={`w-full px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-sm outline-none ${isDark ? "bg-gray-900" : "bg-white"}`} />
              <button onClick={handleDeleteAccount}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Permanently Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
