import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import CreatePostModal from "../post/CreatePostModal";
import { useState } from "react";

export default function MainLayout() {
  const [showCreatePost, setShowCreatePost] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Desktop Sidebar */}
      <Sidebar onCreatePost={() => setShowCreatePost(true)} />

      {/* Main Content */}
      <main className="md:ml-64 xl:ml-72 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-screen-md mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav onCreatePost={() => setShowCreatePost(true)} />

      {/* Create Post Modal */}
      {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} />}
    </div>
  );
}
