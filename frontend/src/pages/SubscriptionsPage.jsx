import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Grid,
  List,
  Bell,
  Check,
  UserX,
  Compass,
  Loader2,
  Tv,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { subscriptionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VideoCard from '../components/VideoCard';

export default function SubscriptionsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('feed');
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [unsubscribingId, setUnsubscribingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?._id) {
      loadInitialData();
    }
  }, [user, isAuthenticated, authLoading]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [channelsRes, feedRes] = await Promise.all([
        subscriptionApi.getSubscribedChannels(user._id).catch(() => ({ data: [] })),
        subscriptionApi.getSubscriptionsFeed().catch(() => ({ data: { videos: [] } })),
      ]);

      setChannels(channelsRes.data || []);
      setVideos(feedRes.data?.videos || []);
    } catch (err) {
      console.error('Failed to load subscriptions data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUnsubscribe = async (channelId) => {
    try {
      setUnsubscribingId(channelId);
      await subscriptionApi.toggleSubscription(channelId);
      setChannels((prev) => prev.filter((ch) => (ch.channelId || ch._id) !== channelId));
      setVideos((prev) => prev.filter((v) => (v.owner?._id || v.owner) !== channelId));
    } catch (err) {
      console.error('Failed to unsubscribe', err);
    } finally {
      setUnsubscribingId(null);
    }
  };

  const filteredVideos =
    selectedChannelId === 'all'
      ? videos
      : videos.filter((v) => (v.owner?._id || v.owner) === selectedChannelId);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl"
            style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
          >
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Subscriptions</h1>
            <p className="text-xs text-zinc-400">
              Latest uploads from creators you follow ({channels.length} subscribed)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'feed'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Videos Feed
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'manage'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Manage Channels
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-6 sm:p-8 max-w-md mx-auto space-y-4">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Don't miss new videos</h3>
            <p className="text-xs text-zinc-400">
              Subscribe to your favorite channels to see their latest videos and get notified.
            </p>
          </div>
          <Link
            to="/?explore=true"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-lg active:scale-95"
            style={{ backgroundColor: currentTheme.color }}
          >
            <Compass className="w-4 h-4" />
            <span>Discover Channels</span>
          </Link>
        </div>
      ) : activeTab === 'feed' ? (
        <div className="space-y-6">
          {/* Subscribed Channels Avatar Bar */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedChannelId('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition border ${
                selectedChannelId === 'all'
                  ? 'bg-white text-zinc-950 border-white shadow-md'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <span>All uploads</span>
            </button>

            {channels.map((ch) => {
              const chId = ch.channelId || ch._id;
              const isSelected = selectedChannelId === chId;
              const avatar =
                ch.channelAvatar ||
                ch.avatar ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${ch.channelUsername || ch.username}`;

              return (
                <button
                  key={chId}
                  onClick={() => setSelectedChannelId(chId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition border ${
                    isSelected
                      ? 'bg-zinc-800 text-white border-zinc-600 shadow-md'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <img src={avatar} alt={ch.username} className="w-5 h-5 rounded-full object-cover" />
                  <span>{ch.fullname || ch.channelUsername || ch.username}</span>
                </button>
              );
            })}
          </div>

          {/* Videos Grid */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800/60 p-6 space-y-2">
              <Tv className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No new videos right now</h4>
              <p className="text-xs text-zinc-500">
                Videos from your subscribed channels will automatically appear here as soon as they publish.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredVideos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Manage Channels View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
            <span>Channels ({channels.length})</span>
            <span>Subscription</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl divide-y divide-zinc-800/60 overflow-hidden">
            {channels.map((ch) => {
              const chId = ch.channelId || ch._id;
              const username = ch.channelUsername || ch.username;
              const fullname = ch.fullname || username;
              const avatar =
                ch.channelAvatar ||
                ch.avatar ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
              const isUnsubbing = unsubscribingId === chId;

              return (
                <div key={chId} className="flex items-center justify-between p-4 hover:bg-zinc-850/50 transition">
                  <Link to={`/c/${username}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                    <img src={avatar} alt={username} className="w-11 h-11 rounded-full object-cover shrink-0 border border-zinc-700" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{fullname}</p>
                      <p className="text-xs text-zinc-400 truncate">@{username}</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleToggleUnsubscribe(chId)}
                    disabled={isUnsubbing}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 text-zinc-300 transition flex items-center gap-1.5"
                  >
                    {isUnsubbing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                    <span>Unsubscribe</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
