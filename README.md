# 🎬 VidTube Backend API

<p align="center">

![Node](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Framework-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Project-Active-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</p>

A scalable **video platform backend API** inspired by YouTube.

Built with **Node.js, Express.js, MongoDB and JWT authentication**.  
This backend powers a video streaming and social interaction platform including videos, comments, likes, playlists, subscriptions, and creator analytics.

---

# ✨ Features

🎥 Video upload & management  
💬 Comment system  
👍 Like / dislike system  
📂 Playlist management  
📺 Channel subscription system  
🐦 Tweet / community post system  
📊 Creator dashboard analytics  
🔐 JWT authentication  
🩺 Healthcheck API  
⚡ RESTful API architecture  

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|--------|
| Node.js | Backend runtime |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Multer | File uploads |
| Cloudinary | Media storage |

---

# 📁 Project Structure

```
src
│
├── controllers
├── middlewares
├── models
├── routes
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
├── utils
├── validators
├── app.js
└── index.js
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Alok-Pandey-Coder/VidTube-Backend-API.git
```

Navigate into the project

```bash
cd VidTube-Backend-API
```

Install dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory.

```
PORT=8000

MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# ▶️ Running the Server

Start development server

```bash
npm run dev
```

Start production server

```bash
npm start
```

Server runs on

```
http://localhost:8000
```

---

# 📡 Base API URL

```
/api/v1
```

Example

```
http://localhost:8000/api/v1/users/register
```

---

# 📬 Postman API Documentation

Full API documentation is available on Postman.

View documentation:

```
https://documenter.getpostman.com/view/YOUR_POSTMAN_DOC_ID
```

---

# 🚀 Run API in Postman

Import the API collection directly into Postman.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/YOUR_COLLECTION_ID)

---

# 📚 API Overview

## 🩺 Healthcheck

```
GET /api/v1/healthcheck
```

Returns server status.

Example response

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

# 👤 Users

```
POST   /api/v1/users/register
POST   /api/v1/users/login
POST   /api/v1/users/logout
GET    /api/v1/users/current-user
PATCH  /api/v1/users/update-account
PATCH  /api/v1/users/change-password
```

---

# 🎥 Videos

```
POST   /api/v1/videos
GET    /api/v1/videos
GET    /api/v1/videos/:videoId
PATCH  /api/v1/videos/:videoId
DELETE /api/v1/videos/:videoId
```

---

# 💬 Comments

```
GET    /api/v1/comments/:videoId
POST   /api/v1/comments/:videoId
PATCH  /api/v1/comments/c/:commentId
DELETE /api/v1/comments/c/:commentId
```

---

# 👍 Likes

```
POST /api/v1/likes/toggle/video/:videoId
POST /api/v1/likes/toggle/comment/:commentId
POST /api/v1/likes/toggle/tweet/:tweetId
```

---

# 📂 Playlists

```
POST   /api/v1/playlists
GET    /api/v1/playlists/:playlistId
PATCH  /api/v1/playlists/:playlistId
DELETE /api/v1/playlists/:playlistId
```

---

# 📺 Subscriptions

```
POST /api/v1/subscriptions/c/:channelId
GET  /api/v1/subscriptions/u/:userId
```

---

# 🐦 Tweets

```
POST   /api/v1/tweets
GET    /api/v1/tweets/user/:userId
PATCH  /api/v1/tweets/:tweetId
DELETE /api/v1/tweets/:tweetId
```

---

# 📊 Dashboard

```
GET /api/v1/dashboard/stats/:channelId
GET /api/v1/dashboard/videos/:channelId
```

---

# 🔐 Authentication

Protected routes require a JWT token.

Header example

```
Authorization: Bearer <access_token>
```

---

# 📦 NPM Scripts

| Script | Description |
|------|------|
| npm run dev | Start development server |
| npm start | Start production server |

---

# 🤝 Contributing

Fork the repository

Create a new branch

```
git checkout -b feature/my-feature
```

Commit changes

```
git commit -m "Added new feature"
```

Push branch

```
git push origin feature/my-feature
```

Open a Pull Request.

---

# ⭐ Support

If you like this project

⭐ Star the repository  
🍴 Fork the repo  
🚀 Build your own video platform

---

# 📄 License

MIT License
