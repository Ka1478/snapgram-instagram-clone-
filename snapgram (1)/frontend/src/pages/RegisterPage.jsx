import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Loader } from "lucide-react";
import { useAuthStore } from "../context/authStore";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", fullName: "", username: "", password: "" });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success("Welcome to Snapgram! 🎉");
      navigate("/");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-4 shadow-sm animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 snapgram-gradient rounded-xl flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold snapgram-gradient-text tracking-tight">Snapgram</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-snug">
              Sign up to see photos and videos from your friends.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
              className="input-field"
              required
              minLength={3}
              maxLength={30}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={isLoading || Object.values(form).some((v) => !v)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : "Sign up"}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            By signing up, you agree to our{" "}
            <a href="#" className="font-semibold text-gray-700 dark:text-gray-300">Terms</a>,{" "}
            <a href="#" className="font-semibold text-gray-700 dark:text-gray-300">Privacy Policy</a> and{" "}
            <a href="#" className="font-semibold text-gray-700 dark:text-gray-300">Cookies Policy</a>.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center text-sm shadow-sm">
          Have an account?{" "}
          <Link to="/login" className="text-blue-500 font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
