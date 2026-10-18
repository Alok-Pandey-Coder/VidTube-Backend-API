import mongoose, {Schema} from "mongoose"

const watchProgressSchema = new Schema(
  {
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    video: {type: Schema.Types.ObjectId, ref: 'Video', required: true},
    position: {type: Number, default: 0},
    duration: {type: Number, default: 0},
    completed: {type: Boolean, default: false},
    lastWatchedAt: {type: Date, default: Date.now()},
  },
  {timestamps: true}
)

watchProgressSchema.index({user: 1, video: 1}, {unique: true});
watchProgressSchema.index({user: 1, lastWatchedAt: -1})

export const WatchProgress = mongoose.model('WatchProgress', watchProgressSchema);