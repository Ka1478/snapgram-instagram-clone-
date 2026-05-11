import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Loader, ArrowLeft, Mail } from "lucide-react";
import { useAuthStore } from "../context/authStore";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { forgotPassword, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    if (result.success) {
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
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
              {sent ? "Check your email" : "Trouble logging in?"}
            </p>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Mail size={28} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We sent a password reset link to
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{email}</p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                The link expires in 15 minutes. Didn't get it? Check your spam folder.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-blue-500 text-sm font-semibold hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-5">
                Enter your email and we'll send you a link to get back into your account.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader size={18} className="animate-spin" /> : "Send Reset Link"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="text-xs text-gray-400 font-semibold uppercase">Or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>

              <p className="text-center text-sm">
                <Link to="/register" className="text-gray-800 dark:text-gray-200 font-semibold hover:underline">
                  Create new account
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Back to login */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center text-sm shadow-sm">
          <Link to="/login" className="text-blue-500 font-semibold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
