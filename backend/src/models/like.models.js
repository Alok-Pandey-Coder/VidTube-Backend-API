import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "onModel"
    },
    onModel: {
      type: String,
      required: true,
      enum: ["Video", "Comment", "Tweet"]
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

likeSchema.index({ target: 1, likedBy: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);