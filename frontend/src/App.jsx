import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import UploadModal from './components/UploadModal';
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChannelPage from './pages/ChannelPage';
import DashboardPage from './pages/DashboardPage';
import LikedVideosPage from './pages/LikedVideosPage';
import HistoryPage from './pages/HistoryPage';
import TweetsPage from './pages/TweetsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleOpenUpload = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsUploadOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUpload={handleOpenUpload}
      />

      <div className="flex flex-1">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 transition-all duration-300">
          <Routes>
            <Route path="/" element={<HomePage onOpenUpload={handleOpenUpload} />} />
            <Route path="/watch/:videoId" element={<WatchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/c/:username" element={<ChannelPage />} />
            <Route path="/dashboard" element={<DashboardPage onOpenUpload={handleOpenUpload} />} />
            <Route path="/liked-videos" element={<LikedVideosPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/tweets" element={<TweetsPage />} />
            <Route path="*" element={<HomePage onOpenUpload={handleOpenUpload} />} />
          </Routes>
        </main>
      </div>

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newVideo) => {
          if (newVideo?._id) {
            navigate(`/watch/${newVideo._id}`);
          } else {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
