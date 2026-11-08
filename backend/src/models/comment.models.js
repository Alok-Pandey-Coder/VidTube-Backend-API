import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      refPath: "onModel",
      required: true,
      index: true,
    },
    onModel: {
      type: String,
      enum: ["Video", "Short"],
      default: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

commentSchema.index({ video: 1, parentId: 1, isPinned: -1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
