import mongoose, { Schema } from 'mongoose';

const transcriptSchema = new Schema({
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true, unique: true },
  language: String,
  text: String,
  segments: [{ _id: false, start: Number, end: Number, text: String }],
});

export const Transcript = mongoose.model('Transcript', transcriptSchema);