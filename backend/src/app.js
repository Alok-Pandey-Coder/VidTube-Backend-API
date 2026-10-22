import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import path from "path"

const app = express();
app.set("trust proxy", 1);  

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser())

const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl) or any localhost port
    if (!origin || allowedOrigin === "*" || allowedOrigin === origin || origin.startsWith("http://localhost")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use("/media", express.static(path.resolve("storage"))); 

import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js"
import WatchLaterRouter from "./routes/watchLater.routes.js"


app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/watch-later", WatchLaterRouter);


export { app }