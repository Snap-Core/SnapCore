import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  actor: { type: String, required: true },
  object: { type: String, required: true }, 
  activityPubObject: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

followSchema.index({ actor: 1, object: 1 }, { unique: true }); 

const Follow = mongoose.model('Follow', followSchema);
export default Follow;
