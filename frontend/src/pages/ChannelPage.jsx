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
import { authApi, videoApi, tweetApi, subscriptionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { timeAgo } from '../utils/formatters';

export default function ChannelPage() {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        setLoading(true);
        const res = await authApi.getUserProfile(username);
        const data = res.data;
        setProfile(data);
        setIsSubscribed(data.isSubscribed);
        setSubscribersCount(data.subscribersCount || 0);

        if (data?._id) {
          // Fetch channel videos
          try {
            const vidRes = await videoApi.getAllVideos({ userId: data._id });
            setVideos(vidRes.data?.data || vidRes.data || []);
          } catch (e) {
            console.warn('Channel videos not found', e);
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
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [username]);

  const handleToggleSub = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    if (!profile?._id) return;

    try {
      await subscriptionApi.toggleSubscription(profile._id);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? Math.max(0, prev - 1) : prev + 1));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Channel Not Found</h2>
        <p className="text-xs text-zinc-400 mt-2">The user @{username} does not exist.</p>
      </div>
    );
  }

  const isOwner = currentUser && currentUser._id === profile._id;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Cover Image */}
      <div className="w-full h-40 sm:h-60 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <Tv2 className="w-20 h-20 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="px-6 pt-4 pb-6 border-b border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-zinc-950 shadow-2xl bg-zinc-900"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{profile.fullname}</h1>
                <CheckCircle2 className="w-5 h-5 text-red-500 fill-red-500/20" />
              </div>
              <p className="text-sm text-zinc-400">@{profile.username}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
                <span>{subscribersCount} subscribers</span>
                <span>•</span>
                <span>{videos.length} videos</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwner ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition"
              >
                Manage Channel
              </Link>
            ) : (
              <button
                onClick={handleToggleSub}
                className={`px-6 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 ${
                  isSubscribed
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-white text-zinc-950 hover:bg-zinc-200'
                }`}
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
        <div className="flex gap-8 mt-8 text-sm font-semibold border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('videos')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'videos'
                ? 'text-white border-red-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Videos ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tweets')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tweets'
                ? 'text-white border-red-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Community Posts ({tweets.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'videos' && (
          videos.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              This channel has not published any videos yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((vid) => (
                <VideoCard key={vid._id || vid.id} video={vid} />
              ))}
            </div>
          )
        )}

        {activeTab === 'tweets' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {tweets.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-sm">
                No community posts shared by @{profile.username} yet.
              </div>
            ) : (
              tweets.map((t) => (
                <div key={t._id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-white">@{profile.username}</span>
                    <span>•</span>
                    <span>{timeAgo(t.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">{t.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
