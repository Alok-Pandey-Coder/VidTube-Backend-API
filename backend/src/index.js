import dotenv from "dotenv"
import { app } from "./app.js"
import  connectDB  from "./db/index.js";
import { startSubscriber } from "../services/sseHub.js";
import * as Sentry from '@sentry/node';

dotenv.config({
  path: "./.env"
})

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}


const port = process.env.PORT || 3000;

connectDB()
 .then(() => {
    app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
    startSubscriber();
    })
    
  })
 .catch((err) => {
  console.log("MongoDB Connection error", err)
  })





