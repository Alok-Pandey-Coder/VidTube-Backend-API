import mongoose, { Schema } from 'mongoose';

const videoDailyStatSchema = new Schema({
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  channel: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Date, required: true },
  views: { type: Number, default: 0 },
});

videoDailyStatSchema.index({ video: 1, day: 1 }, { unique: true });
videoDailyStatSchema.index({ channel: 1, day: 1 });

export const VideoDailyStat = mongoose.model('VideoDailyStat', videoDailyStatSchema);