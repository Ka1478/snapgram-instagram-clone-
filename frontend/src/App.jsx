import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import { useAuthStore } from "./context/authStore";
import MainLayout from "./components/layout/MainLayout";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Lazy loaded pages
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ReelsPage = lazy(() => import("./pages/ReelsPage"));
const HashtagPage = lazy(() => import("./pages/HashtagPage"));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
  const { getMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) getMe();
  }, []);

  return (
    <ThemeProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: "12px", fontSize: "14px" },
            }}
          />
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<HomePage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="profile/:username" element={<ProfilePage />} />
                <Route path="edit-profile" element={<EditProfilePage />} />
                <Route path="posts/:postId" element={<PostDetailPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:userId" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="reels" element={<ReelsPage />} />
                <Route path="hashtag/:tag" element={<HashtagPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
  );
}
