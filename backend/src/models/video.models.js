import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
  {
    videoFile: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    // CHANGE 3: naya storage system
    storageKey: {
      type: String,
    },
    storageProvider: {
      type: String,
      enum: ["cloudinary", "local", "s3"],
      default: "cloudinary",     // purane videos automatically "cloudinary" maane jayenge
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "ready",          // purane videos already ready hain
    },
    //hlskey addition for hls support
    hlsKey: {
      type: String,
    },
    thumbnail: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    views: {
      type: Number, 
      default: 0
    }, 
    duration: {
      type: Number,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },{timestamps: true,}
)

export const Video = mongoose.model("Video", videoSchema)