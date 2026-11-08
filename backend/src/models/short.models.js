import mongoose, { Schema } from 'mongoose';

const shortSchema = new Schema(
  {
    videoFile: {
      url: { type: String },
      public_id: { type: String },
    },
    storageKey: { type: String },
    storageProvider: {
      type: String,
      enum: ['cloudinary', 'local', 's3'],
      default: 'cloudinary',
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'failed'],
      default: 'ready',
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    views: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number, // seconds, should be <= 180
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tags: [String],
    audioTrack: { type: String }, // optional background music name
  },
  { timestamps: true },
);

shortSchema.index({ isPublished: 1, createdAt: -1, _id: -1 });
shortSchema.index({ owner: 1, isPublished: 1 });

export const Short = mongoose.model('Short', shortSchema);
