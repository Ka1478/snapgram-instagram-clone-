import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Loader, CheckCircle } from "lucide-react";
import { useAuthStore } from "../context/authStore";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const result = await resetPassword(token, form.newPassword);
    if (result.success) {
      setDone(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 2500);
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
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {done ? "All done!" : "Create a new password"}
            </p>
          </div>

          {done ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={30} className="text-green-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your password has been reset. Redirecting you to login…
              </p>
            </div>
          ) : (
            /* Form state */
            <>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-5">
                Enter a new password for your account.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* New Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password match indicator */}
                {form.confirmPassword && (
                  <p className={`text-xs ${form.newPassword === form.confirmPassword ? "text-green-500" : "text-red-500"}`}>
                    {form.newPassword === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !form.newPassword || !form.confirmPassword}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader size={18} className="animate-spin" /> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        {!done && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center text-sm shadow-sm">
            Remembered your password?{" "}
            <Link to="/login" className="text-blue-500 font-semibold hover:underline">
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
