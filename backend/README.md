<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=200&section=header&text=🎬%20VidTube%20Backend%20API&fontSize=48&fontColor=fff&animation=twinkling&fontAlignY=38&desc=A%20Scalable%20YouTube-Inspired%20Video%20Platform%20Backend&descAlignY=58&descSize=15" width="100%"/>

</div>

<div align="center">

![Node](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-FF6C37?style=for-the-badge&logo=npm&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

</div>

<div align="center">

[![Live Production](https://img.shields.io/badge/🟢_Live_Production-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://vidtube-backend-api-production.up.railway.app)
[![Postman Docs](https://img.shields.io/badge/Postman-API_Docs-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://shivam-4520593.postman.co/workspace/shivam's-Workspace~ddb3db7f-7da8-4950-8982-48fda195d56d/collection/46226297-18767b71-4533-4b12-a6a4-6a6db5c6ad64?action=share&creator=46226297)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Alok-Pandey-Coder/VidTube-Backend-API)

</div>

<br/>

---

## 📖 Overview

**VidTube Backend API** is a production-grade, scalable REST API backend inspired by YouTube. Built with **Node.js**, **Express.js**, and **MongoDB**, it powers a complete video streaming and social interaction platform — handling everything from video uploads and authentication to playlists, subscriptions, comments, likes, and creator analytics.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based access & refresh token system |
| 🎥 **Video Management** | Upload, update, delete & toggle publish status |
| 💬 **Comments** | Add, edit, delete comments on videos |
| 👍 **Likes** | Toggle likes on videos, comments & tweets |
| 📂 **Playlists** | Create & manage video playlists |
| 📺 **Subscriptions** | Subscribe/unsubscribe to channels |
| 🐦 **Tweets** | Community post / tweet system |
| 📊 **Dashboard** | Channel stats & video analytics |
| ☁️ **Media Storage** | Cloudinary CDN for video & image uploads |
| 🩺 **Healthcheck** | API health monitoring endpoint |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT (Access + Refresh Tokens) |
| **File Uploads** | Multer |
| **Media Storage** | Cloudinary |
| **Security** | Cookie Parser, CORS |

---

## 🌐 Live URLs

### Production Server
```
https://vidtube-backend-api-production.up.railway.app
```

### Base API URL
```
https://vidtube-backend-api-production.up.railway.app/api/v1
```

### Local Development
```
http://localhost:8000/api/v1
```

### Health Check
```
GET https://vidtube-backend-api-production.up.railway.app/api/v1/healthcheck
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Alok-Pandey-Coder/VidTube-Backend-API.git
cd VidTube-Backend-API
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

---

## 📡 API Reference

> 🔐 Routes marked as **Protected** require `Authorization: Bearer <access_token>` header.
> All routes are prefixed with `/api/v1`

---

### 🩺 Healthcheck
**Base:** `/api/v1/healthcheck`

| Method | Endpoint | Description | Auth |
|:---:|---|---|:---:|
| `GET` | `/` | Check server health status | ❌ |

**Response:**
```json
{
  "statusCode": 200,
  "data": "OK",
  "message": "Health check passed",
  "success": true
}
```

---

### 👤 Users
**Base:** `/api/v1/users`

| Method | Endpoint | Description | Auth |
|:---:|---|---|:---:|
| `GET` | `/register` | Register new user (avatar + coverImage upload) | ❌ |
| `POST` | `/login` | Login & get tokens | ❌ |
| `POST` | `/refresh-token` | Get new access token via refresh token | ❌ |
| `POST` | `/logout` | Logout current user | ✅ |
| `POST` | `/change-password` | Change current password | ✅ |
| `GET` | `/current-user` | Get logged-in user details | ✅ |
| `GET` | `/c/:username` | Get user channel profile by username | ✅ |
| `PATCH` | `/update-account` | Update account details | ✅ |
| `PATCH` | `/avatar` | Update user avatar image | ✅ |
| `PATCH` | `/cover-image` | Update user cover image | ✅ |
| `GET` | `/history` | Get watch history | ✅ |

> 📎 `/register` accepts `multipart/form-data` with fields: `avatar` (required), `coverImage` (optional)
> 📎 `/avatar` and `/cover-image` accept `multipart/form-data` with single file upload

---

### 🎥 Videos
**Base:** `/api/v1/videos` — 🔐 All routes protected

| Method | Endpoint | Description | Upload |
|:---:|---|---|:---:|
| `GET` | `/` | Get all videos (with filters/pagination) | — |
| `POST` | `/` | Publish/upload a new video | `videoFile` + `thumbnail` |
| `GET` | `/:videoId` | Get video by ID | — |
| `DELETE` | `/:videoId` | Delete a video | — |
| `PATCH` | `/:videoId` | Update video details | `thumbnail` (optional) |
| `PATCH` | `/toggle/publish/:videoId` | Toggle video publish status | — |

> 📎 `POST /` accepts `multipart/form-data` with: `videoFile` (maxCount: 1), `thumbnail` (maxCount: 1)

---

### 💬 Comments
**Base:** `/api/v1/comments` — 🔐 All routes protected

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/:videoId` | Get all comments for a video |
| `POST` | `/:videoId` | Add a comment to a video |
| `PATCH` | `/c/:commentId` | Update a comment |
| `DELETE` | `/c/:commentId` | Delete a comment |

---

### 👍 Likes
**Base:** `/api/v1/likes` — 🔐 All routes protected

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/toggle/v/:videoId` | Toggle like on a video |
| `POST` | `/toggle/c/:commentId` | Toggle like on a comment |
| `POST` | `/toggle/t/:tweetId` | Toggle like on a tweet |
| `GET` | `/videos` | Get all videos liked by current user |

---

### 📂 Playlists
**Base:** `/api/v1/playlist` — 🔐 All routes protected

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/` | Create a new playlist |
| `GET` | `/:playlistId` | Get playlist by ID |
| `PATCH` | `/:playlistId` | Update playlist details |
| `DELETE` | `/:playlistId` | Delete a playlist |
| `PATCH` | `/add/:videoId/:playlistId` | Add a video to a playlist |
| `PATCH` | `/remove/:videoId/:playlistId` | Remove a video from a playlist |
| `GET` | `/user/:userId` | Get all playlists of a user |

---

### 📺 Subscriptions
**Base:** `/api/v1/subscriptions` — 🔐 All routes protected

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/c/:channelId` | Toggle subscribe/unsubscribe to a channel |
| `GET` | `/c/:channelId` | Get channels subscribed to by a user |
| `GET` | `/u/:channelId` | Get all subscribers of a channel |

---

### 🐦 Tweets
**Base:** `/api/v1/tweet` — 🔐 All routes protected

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/` | Create a new tweet/community post |
| `GET` | `/user/:userId` | Get all tweets by a user |
| `PATCH` | `/:tweetId` | Update a tweet |
| `DELETE` | `/:tweetId` | Delete a tweet |

---

### 📊 Dashboard
**Base:** `/api/v1/dashboard` — 🔐 All routes protected

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/stats/:channelId` | Get channel stats (views, subscribers, videos, likes) |
| `GET` | `/videos/:channelId` | Get all videos uploaded by a channel |

---

## 🔐 Authentication Flow

```
1. Register     →  POST /api/v1/users/register
2. Login        →  POST /api/v1/users/login          → returns accessToken + refreshToken
3. Use APIs     →  Add header: Authorization: Bearer <accessToken>
4. Token Expiry →  POST /api/v1/users/refresh-token  → get new accessToken
5. Logout       →  POST /api/v1/users/logout
```

---

## 📁 Project Structure

```
src/
├── controllers/
│   ├── comment.controller.js
│   ├── dashboard.controller.js
│   ├── healthcheck.controller.js
│   ├── like.controller.js
│   ├── playlist.controller.js
│   ├── subscription.controller.js
│   ├── tweet.controller.js
│   ├── user.controllers.js
│   └── video.controller.js
│
├── middlewares/
│   ├── auth.middleware.js       # verifyJWT
│   └── multer.middlewares.js    # file upload config
│
├── models/
├── routes/
│   ├── comment.routes.js
│   ├── dashboard.routes.js
│   ├── healthcheck.routes.js
│   ├── like.routes.js
│   ├── playlist.routes.js
│   ├── subscription.routes.js
│   ├── tweet.routes.js
│   ├── user.routes.js
│   └── video.routes.js
│
├── utils/
├── app.js                       # Express app + middleware config
└── index.js                     # Server entry point
```

---

## 📬 API Documentation

Explore and test all endpoints using the Postman collection:

[![Postman](https://img.shields.io/badge/View_in_Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://shivam-4520593.postman.co/workspace/shivam's-Workspace~ddb3db7f-7da8-4950-8982-48fda195d56d/collection/46226297-18767b71-4533-4b12-a6a4-6a6db5c6ad64?action=share&creator=46226297)

---

## 🤝 Contributing

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/AmazingFeature

# 3. Commit your changes
git commit -m "Add AmazingFeature"

# 4. Push to the branch
git push origin feature/AmazingFeature

# 5. Open a Pull Request
```

---

## 📄 License

Distributed under the **MIT License**.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=100&section=footer" width="100%"/>

**Built with ❤️ by [Alok Kumar Pandey](https://github.com/Alok-Pandey-Coder)**

⭐ If you found this project helpful, please give it a star!

</div>
