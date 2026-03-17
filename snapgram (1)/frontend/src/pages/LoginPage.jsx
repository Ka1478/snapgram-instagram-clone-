import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Loader } from "lucide-react";
import { useAuthStore } from "../context/authStore";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-4 shadow-sm animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 snapgram-gradient rounded-xl flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold snapgram-gradient-text tracking-tight">Snapgram</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Sign in to see photos from your friends</p>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !form.email || !form.password}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-gray-400 font-semibold uppercase">Or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>

          <p className="text-center text-sm">
            <a href="#" className="text-blue-500 font-semibold hover:underline">
              Forgot password?
            </a>
          </p>
        </div>

        {/* Sign up link */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center text-sm shadow-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 font-semibold hover:underline">
            Sign up
          </Link>
        </div>

        {/* App download placeholder */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 mb-3">Get the app</p>
          <div className="flex justify-center gap-3">
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
              App Store
            </div>
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
              Google Play
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
