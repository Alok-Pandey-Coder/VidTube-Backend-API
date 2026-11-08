import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Tv2, 
  UserCheck, 
  Film, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  Layers
} from 'lucide-react';
import { authApi, videoApi, tweetApi, subscriptionApi, shortsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VideoCard from '../components/VideoCard';
import ShortCard from '../components/ShortCard';
import ShortsIcon from '../components/ShortsIcon';
import { timeAgo } from '../utils/formatters';

export default function ChannelPage() {
  const { username } = useParams();
  const cleanUsername = (username || '').replace(/^@/, '');
  const { user: currentUser, isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        setLoading(true);
        const fetcher = authApi.getUserChannelProfile || authApi.getUserProfile;
        const res = await fetcher(cleanUsername);
        const data = res?.data;
        if (!data) {
          setProfile(null);
          return;
        }
        setProfile(data);
        setIsSubscribed(Boolean(data.isSubscribed));
        setSubscribersCount(data.subscribersCount || 0);

        if (data?._id) {
          // Fetch channel videos
          try {
            const vidRes = await videoApi.getAllVideos({ userId: data._id });
            setVideos(vidRes.data?.data || vidRes.data || []);
          } catch (e) {
            console.warn('Channel videos not found', e);
          }

          // Fetch channel shorts
          try {
            const shortRes = await shortsApi.getFeed({ userId: data._id, limit: 30 });
            setShorts(shortRes.data || []);
          } catch (e) {
            console.warn('Channel shorts not found', e);
          }

          // Fetch channel tweets
          try {
            const tweetRes = await tweetApi.getUserTweets(data._id);
            setTweets(tweetRes.data || []);
          } catch (e) {
            console.warn('Channel tweets not found', e);
          }
        }
      } catch (err) {
        console.error('Failed to load channel profile', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (cleanUsername) {
      fetchChannel();
    } else {
      setLoading(false);
    }
  }, [cleanUsername]);

  const handleToggleSub = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    if (!profile?._id) return;

    const nextState = !isSubscribed;
    setIsSubscribed(nextState);
    setSubscribersCount((c) => c + (nextState ? 1 : -1));

    try {
      await subscriptionApi.toggleSubscription(profile._id);
    } catch (e) {
      setIsSubscribed(!nextState);
      setSubscribersCount((c) => c + (!nextState ? 1 : -1));
      console.error('Subscribe toggle error', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 sm:p-8 bg-zinc-900 rounded-3xl border border-zinc-800 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Channel Not Found</h2>
        <p className="text-xs text-zinc-400">The channel @{cleanUsername} does not exist.</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-full text-xs font-bold text-white transition active:scale-95"
          style={{ backgroundColor: currentTheme.color }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = currentUser && currentUser._id === profile._id;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Cover Image */}
      <div className="w-full h-32 sm:h-48 md:h-60 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <Tv2 className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 sm:pt-4 pb-6 border-b border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 md:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3.5">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-zinc-950 shadow-2xl bg-zinc-900 shrink-0 relative z-10"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{profile.fullname}</h1>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">@{profile.username}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500 pt-0.5">
                <span>{subscribersCount} subscribers</span>
                <span>•</span>
                <span>{videos.length} videos</span>
                <span>•</span>
                <span>{shorts.length} shorts</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pt-0">
            {isOwner ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition"
              >
                Creator Studio
              </Link>
            ) : (
              <button
                onClick={handleToggleSub}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 ${
                  isSubscribed
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'text-white'
                }`}
                style={
                  !isSubscribed
                    ? {
                        backgroundColor: currentTheme.color,
                        boxShadow: `0 0 16px ${currentTheme.bgGlow}`,
                      }
                    : {}
                }
              >
                {isSubscribed ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Channel Navigation Tabs */}
        <div className="flex gap-6 sm:gap-8 mt-6 sm:mt-8 text-sm font-bold border-b border-zinc-800/80 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('videos')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 select-none ${
              activeTab === 'videos'
                ? 'text-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            style={{
              borderColor: activeTab === 'videos' ? currentTheme.color : 'transparent',
              color: activeTab === 'videos' ? '#ffffff' : undefined,
            }}
          >
            <Film className="w-4 h-4" />
            <span>Videos ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shorts')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 select-none ${
              activeTab === 'shorts'
                ? 'text-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            style={{
              borderColor: activeTab === 'shorts' ? currentTheme.color : 'transparent',
              color: activeTab === 'shorts' ? '#ffffff' : undefined,
            }}
          >
            <ShortsIcon className={`w-4 h-4 ${activeTab === 'shorts' ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
            <span>Shorts ({shorts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tweets')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 select-none ${
              activeTab === 'tweets'
                ? 'text-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            style={{
              borderColor: activeTab === 'tweets' ? currentTheme.color : 'transparent',
              color: activeTab === 'tweets' ? '#ffffff' : undefined,
            }}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Community ({tweets.length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {activeTab === 'videos' && (
          videos.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs sm:text-sm">
              No videos uploaded by this channel yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {videos.map((vid) => (
                <VideoCard key={vid._id || vid.id} video={vid} />
              ))}
            </div>
          )
        )}

        {activeTab === 'shorts' && (
          shorts.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs sm:text-sm">
              No shorts uploaded by this channel yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {shorts.map((s) => (
                <ShortCard key={s._id || s.id} video={s} />
              ))}
            </div>
          )
        )}

        {activeTab === 'tweets' && (
          tweets.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs sm:text-sm">
              No community posts from this creator yet.
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {tweets.map((t) => (
                <div key={t._id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={profile.avatar}
                      alt={profile.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">@{profile.username}</span>
                      <span className="text-[11px] text-zinc-500 ml-2">{timeAgo(t.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{t.content}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
