import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For cookies if supported
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT access token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vidtube_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
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
      !originalRequest.url?.includes("/users/login") &&
      !originalRequest.url?.includes("/users/register") &&
      !originalRequest.url?.includes("/users/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true },
        );
        const newAccessToken = refreshRes.data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem("vidtube_token", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed, clear session
        localStorage.removeItem("vidtube_token");
        localStorage.removeItem("vidtube_user");
        window.dispatchEvent(new Event("vidtube_auth_logout"));
      }
    }
    return Promise.reject(error);
  },
);

// --- API Service Methods ---

export const authApi = {
  login: async (credentials) => {
    const res = await api.post("/users/login", credentials);
    return res.data;
  },
  register: async (formData) => {
    const res = await api.post("/users/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  logout: async () => {
    const res = await api.post("/users/logout");
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get("/users/current-user");
    return res.data;
  },
  changePassword: async (passwords) => {
    const res = await api.post("/users/change-password", passwords);
    return res.data;
  },
  updateAccount: async (data) => {
    const res = await api.patch("/users/update-account", data);
    return res.data;
  },
  updateAvatar: async (formData) => {
    const res = await api.patch("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  updateCoverImage: async (formData) => {
    const res = await api.patch("/users/cover-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  getUserChannelProfile: async (username) => {
    const cleanUsername = (username || "").replace(/^@/, "");
    const res = await api.get(`/users/c/${cleanUsername}`);
    return res.data;
  },
  getUserProfile: async (username) => {
    const cleanUsername = (username || "").replace(/^@/, "");
    const res = await api.get(`/users/c/${cleanUsername}`);
    return res.data;
  },
  getWatchHistory: async () => {
    const res = await api.get("/users/history");
    return res.data;
  },
};

export const videoApi = {
  getShorts: async (params = {}) => {
    // Legacy – kept for backward compatibility; prefer shortsApi.getFeed()
    const res = await api.get("/videos/feed/shorts", { params });
    return res.data;
  },
  getAllVideos: async (params = {}) => {
    const res = await api.get("/videos", { params });
    return res.data;
  },
  getVideoById: async (videoId) => {
    const res = await api.get(`/videos/${videoId}`);
    return res.data;
  },
  publishVideo: async (formData, onProgress) => {
    const res = await api.post("/videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },
  updateVideo: async (videoId, data) => {
    const res = await api.patch(`/videos/${videoId}`, data);
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
    const res = await api.put(`/videos/${videoId}/progress`, {
      position,
      duration,
    });
    return res.data;
  },
  suggest: async (q, signal) => {
    const res = await api.get("/videos/suggest", { params: { q }, signal });
    return res.data;
  },
  registerView: async (videoId) => {
    const res = await api.post(`/videos/${videoId}/view`);
    return res.data;
  },
  retryProcessing: async (videoId) =>
    (await api.post(`/videos/${videoId}/retry`)).data,
  getRelated: async (videoId, limit = 10) =>
    (await api.get(`/videos/${videoId}/related`, { params: { limit } })).data,
  getTranscript: async (videoId) => (await api.get(`/videos/${videoId}/transcript`)).data,
};

export const commentApi = {
  getVideoComments: async (videoId, params = {}) => {
    const res = await api.get(`/comments/${videoId}`, { params });
    return res.data;
  },
  getReplies: async (commentId) => {
    const res = await api.get(`/comments/replies/${commentId}`);
    return res.data;
  },
  addComment: async (videoId, content, parentId = null) => {
    const res = await api.post(`/comments/${videoId}`, { content, parentId });
    return res.data;
  },
  togglePin: async (commentId) => {
    const res = await api.patch(`/comments/pin/${commentId}`);
    return res.data;
  },
  updateComment: async (commentId, content) => {
    const res = await api.patch(`/comments/c/${commentId}`, { content, newContent: content });
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
      const res = await api.get("/likes/videos");
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
  checkStatus: async (channelId) => {
    const res = await api.get(`/subscriptions/status/${channelId}`);
    return res.data;
  },
  getSubscriptionsFeed: async (params = {}) => {
    const res = await api.get("/subscriptions/feed", { params });
    return res.data;
  },
  getMySubscriptions: async () => {
    const res = await api.get("/subscriptions/channels");
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
  getAllTweets: async (params = {}) => {
    const res = await api.get("/tweet", { params });
    return res.data;
  },
  createTweet: async (data) => {
    const isFormData = data instanceof FormData;
    const res = await api.post("/tweet", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },
  getUserTweets: async (userId) => {
    const res = await api.get(`/tweet/user/${userId}`);
    return res.data;
  },
  updateTweet: async (tweetId, content) => {
    const res = await api.patch(`/tweet/${tweetId}`, { content, newContent: content });
    return res.data;
  },
  deleteTweet: async (tweetId) => {
    const res = await api.delete(`/tweet/${tweetId}`);
    return res.data;
  },
};

export const playlistApi = {
  createPlaylist: async (data) => {
    const res = await api.post("/playlist", data);
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
  checkVideoInPlaylists: async (videoId) => {
    const res = await api.get(`/playlist/check/${videoId}`);
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
  updatePlaylist: async (playlistId, data) => {
    const res = await api.patch(`/playlist/${playlistId}`, data);
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
  getAnalytics: async (days = 28) => {
    const res = await api.get("/dashboard/analytics", { params: { days } });
    return res.data;
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
    const res = await api.get("/watch-later", { params });
    return res.data;
  },
};

export const notificationApi = {
  list: async () => {
    const res = await api.get("/notifications");
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch("/notifications/read-all");
    return res.data;
  },
};

// ─── Shorts API (Shorts as a separate entity) ───────────────────────────────
export const shortsApi = {
  /** Paginated feed of all published shorts */
  getFeed: async (params = {}) => {
    const res = await api.get("/shorts/feed", { params });
    return res.data;
  },
  /** Get a single short by ID */
  getById: async (shortId) => {
    const res = await api.get(`/shorts/${shortId}`);
    return res.data;
  },
  /** Upload a brand-new short (FormData: videoFile, thumbnail, title, description, tags) */
  upload: async (formData, onProgress) => {
    const res = await api.post("/shorts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },
  /** Backward-compatible alias for upload */
  publishShort: function (formData, onProgress) {
    return this.upload(formData, onProgress);
  },
  /** Toggle like on a short */
  toggleLike: async (shortId) => {
    const res = await api.post(`/shorts/${shortId}/like`);
    return res.data;
  },
  /** Register a view on a short */
  registerView: async (shortId) => {
    const res = await api.post(`/shorts/${shortId}/view`);
    return res.data;
  },
  /** Update short metadata */
  update: async (shortId, data) => {
    const res = await api.patch(`/shorts/${shortId}`, data);
    return res.data;
  },
  /** Delete a short */
  delete: async (shortId) => {
    const res = await api.delete(`/shorts/${shortId}`);
    return res.data;
  },
  /** Toggle publish status */
  togglePublish: async (shortId) => {
    const res = await api.patch(`/shorts/${shortId}/publish`);
    return res.data;
  },
  /** Get current user's own shorts */
  getMyShorts: async () => {
    const res = await api.get("/shorts/my");
    return res.data;
  },
};

export default api;
