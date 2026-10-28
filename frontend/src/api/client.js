import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For cookies if supported
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vidtube_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request hasn't been retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/users/login') &&
      !originalRequest.url?.includes('/users/register') &&
      !originalRequest.url?.includes('/users/refresh-token')
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshRes.data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('vidtube_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed, clear session
        localStorage.removeItem('vidtube_token');
        localStorage.removeItem('vidtube_user');
        window.dispatchEvent(new Event('vidtube_auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

// --- API Service Methods ---

export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/users/login', credentials);
    return res.data;
  },
  register: async (formData) => {
    const res = await api.post('/users/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/users/logout');
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/users/current-user');
    return res.data;
  },
  changePassword: async (passwords) => {
    const res = await api.post('/users/change-password', passwords);
    return res.data;
  },
  updateAccount: async (data) => {
    const res = await api.patch('/users/update-account', data);
    return res.data;
  },
  updateAvatar: async (formData) => {
    const res = await api.patch('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  updateCoverImage: async (formData) => {
    const res = await api.patch('/users/cover-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getWatchHistory: async (params = {}) => {
    const res = await api.get('/users/history', { params });
    return res.data;
  },
  getUserProfile: async (username) => {
    const res = await api.get(`/users/c/${username}`);
    return res.data;
  },
};

export const videoApi = {
  getAllVideos: async (params = {}) => {
    const res = await api.get('/videos', { params });
    return res.data;
  },
  getVideoById: async (videoId) => {
    const res = await api.get(`/videos/${videoId}`);
    return res.data;
  },
  publishVideo: async (formData, onProgress) => {
    const res = await api.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },
  updateVideo: async (videoId, formData) => {
    const res = await api.patch(`/videos/${videoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  deleteVideo: async (videoId) => {
    const res = await api.delete(`/videos/${videoId}`);
    return res.data;
  },
  togglePublishStatus: async (videoId) => {
    const res = await api.patch(`/videos/toggle/publish/${videoId}`);
    return res.data;
  },
  saveProgress: async (videoId, position, duration) => {
    const res = await api.put(`/videos/${videoId}/progress`, {position, duration});
    return res.data;
  },
  suggest: async (q, signal) => {
    const res = await api.get('/videos/suggest', { params: { q }, signal });
    return res.data;
  },
  registerView: async (videoId) => {
    const res = await api.post(`/videos/${videoId}/view`);
    return res.data;
  },
};

export const commentApi = {
  getVideoComments: async (videoId, params = {}) => {
    const res = await api.get(`/comments/${videoId}`, { params });
    return res.data;
  },
  addComment: async (videoId, content) => {
    const res = await api.post(`/comments/${videoId}`, { content });
    return res.data;
  },
  updateComment: async (commentId, content) => {
    const res = await api.patch(`/comments/c/${commentId}`, { content });
    return res.data;
  },
  deleteComment: async (commentId) => {
    const res = await api.delete(`/comments/c/${commentId}`);
    return res.data;
  },
};

export const likeApi = {
  toggleVideoLike: async (videoId) => {
    const res = await api.post(`/likes/toggle/v/${videoId}`);
    return res.data;
  },
  toggleCommentLike: async (commentId) => {
    const res = await api.post(`/likes/toggle/c/${commentId}`);
    return res.data;
  },
  toggleTweetLike: async (tweetId) => {
    const res = await api.post(`/likes/toggle/t/${tweetId}`);
    return res.data;
  },
  getLikedVideos: async () => {
    try {
      const res = await api.get('/likes/videos');
      return res.data;
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        return { data: [] };
      }
      throw err;
    }
  },
};

export const subscriptionApi = {
  toggleSubscription: async (channelId) => {
    const res = await api.post(`/subscriptions/c/${channelId}`);
    return res.data;
  },
  getSubscribedChannels: async (channelId) => {
    const res = await api.get(`/subscriptions/c/${channelId}`);
    return res.data;
  },
  getChannelSubscribers: async (channelId) => {
    const res = await api.get(`/subscriptions/u/${channelId}`);
    return res.data;
  },
};

export const tweetApi = {
  createTweet: async (content) => {
    const res = await api.post('/tweet', { content });
    return res.data;
  },
  getUserTweets: async (userId) => {
    const res = await api.get(`/tweet/user/${userId}`);
    return res.data;
  },
  updateTweet: async (tweetId, content) => {
    const res = await api.patch(`/tweet/${tweetId}`, { content });
    return res.data;
  },
  deleteTweet: async (tweetId) => {
    const res = await api.delete(`/tweet/${tweetId}`);
    return res.data;
  },
};

export const playlistApi = {
  createPlaylist: async (data) => {
    const res = await api.post('/playlist', data);
    return res.data;
  },
  getPlaylistById: async (playlistId) => {
    const res = await api.get(`/playlist/${playlistId}`);
    return res.data;
  },
  getUserPlaylists: async (userId) => {
    const res = await api.get(`/playlist/user/${userId}`);
    return res.data;
  },
  addVideoToPlaylist: async (videoId, playlistId) => {
    const res = await api.patch(`/playlist/add/${videoId}/${playlistId}`);
    return res.data;
  },
  removeVideoFromPlaylist: async (videoId, playlistId) => {
    const res = await api.patch(`/playlist/remove/${videoId}/${playlistId}`);
    return res.data;
  },
  deletePlaylist: async (playlistId) => {
    const res = await api.delete(`/playlist/${playlistId}`);
    return res.data;
  },
};

export const dashboardApi = {
  getChannelStats: async (channelId) => {
    const res = await api.get(`/dashboard/stats/${channelId}`);
    return res.data;
  },
  getChannelVideos: async (channelId) => {
    try {
      const res = await api.get(`/dashboard/videos/${channelId}`);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return { data: [] };
      }
      throw err;
    }
  },
};

export const watchLaterApi = {
  add: async (videoId) => {
    const res = await api.put(`/watch-later/${videoId}`);
    return res.data;
  },
  remove: async (videoId) => {
    const res = await api.delete(`/watch-later/${videoId}`);
    return res.data;
  },
  list: async (params = {}) => {
    const res = await api.get('/watch-later', { params });
    return res.data;
  },
};

export const notificationApi = {
  list: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default api;
