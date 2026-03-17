import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const location = useLocation();
  const isReels = location.pathname === "/reels";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Sidebar />
      {isReels ? (
        // Reels page gets full screen treatment
        <div className="md:ml-64 xl:ml-72">
          <div className="page-enter"><Outlet /></div>
        </div>
      ) : (
        <main className="md:ml-64 xl:ml-72 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
            <div className="page-enter"><Outlet /></div>
          </div>
        </main>
      )}
    </div>
  );
}

