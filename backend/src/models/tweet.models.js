import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    video: {
      type: String,
      default: null,
    },
    retweetsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

tweetSchema.index({ createdAt: -1 });

export const Tweet = mongoose.model("Tweet", tweetSchema);
