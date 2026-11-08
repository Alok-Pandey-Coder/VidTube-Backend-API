import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import BackToTop from './components/BackToTop';
import OfflineBanner from './components/OfflineBanner';
import UploadModal from './components/UploadModal';
import UploadShortModal from './components/UploadShortModal';
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
import WatchLaterPage from './pages/WatchLaterPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ShortsPage from './pages/ShortsPage';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploadShortOpen, setIsUploadShortOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const handleOpenUpload = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsUploadOpen(true);
  };

  const handleOpenUploadShort = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsUploadShortOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col selection:bg-red-500 selection:text-white relative overflow-x-hidden">
      {/* Aesthetic Cosmic Ambient Glow Blobs */}
      <div 
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 -z-10 transition-colors duration-700"
        style={{ backgroundColor: currentTheme.color }}
      />
      <div 
        className="fixed bottom-1/4 right-10 w-80 h-80 rounded-full blur-[140px] pointer-events-none opacity-15 -z-10 transition-colors duration-700"
        style={{ backgroundColor: currentTheme.color }}
      />

      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUpload={handleOpenUpload}
        onOpenUploadShort={handleOpenUploadShort}
      />

      <div className="flex flex-1 relative">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 transition-all duration-300 pb-20 md:pb-6">
          <Routes>
            <Route path="/" element={<HomePage onOpenUpload={handleOpenUpload} />} />
            <Route path="/watch/:videoId" element={<WatchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/c/:username" element={<ChannelPage />} />
            <Route path="/dashboard" element={<DashboardPage onOpenUpload={handleOpenUpload} onOpenUploadShort={handleOpenUploadShort} />} />
            <Route path="/liked-videos" element={<LikedVideosPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/tweets" element={<TweetsPage />} />
            <Route path="/watch-later" element={<WatchLaterPage />} />
            <Route path="/shorts" element={<ShortsPage />} />
            <Route path="/shorts/:videoId" element={<ShortsPage />} />
            <Route path="*" element={<HomePage onOpenUpload={handleOpenUpload} />} />
          </Routes>
        </main>
      </div>

      {/* Modern Docked Bottom Navigation on Mobile */}
      <MobileBottomNav
        onOpenUpload={handleOpenUpload}
        onOpenUploadShort={handleOpenUploadShort}
      />

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Offline status banner */}
      <OfflineBanner />

      {/* Global Video Upload Modal */}
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

      {/* Global Shorts Upload Modal */}
      <UploadShortModal
        isOpen={isUploadShortOpen}
        onClose={() => setIsUploadShortOpen(false)}
        onSuccess={(newShort) => {
          navigate('/shorts');
        }}
      />
    </div>
  );
}
