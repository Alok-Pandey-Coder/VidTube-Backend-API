import dotenv from "dotenv"
import { app } from "./app.js"
import  connectDB  from "./db/index.js";
import { startSubscriber } from "../services/sseHub.js";


dotenv.config({
  path: "./.env"
})

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





