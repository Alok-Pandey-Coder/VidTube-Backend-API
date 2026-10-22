import mongoose, {Schema} from "mongoose"


const watchLaterSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  video: {type: Schema.Types.ObjectId, ref: 'Video', required: true},
  addedAt: {type: Date, default: Date.now()},
})

watchLaterSchema.index({user: 1, video: 1}, {unique: true});
watchLaterSchema.index({user: 1, addedAt: -1});

export const WatchLater = mongoose.model('WatchLater', watchLaterSchema);