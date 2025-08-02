import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  actor: { type: String, required: true },         
  object: { type: String, required: true },        
  activityPubObject: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});
likeSchema.index({ actor: 1, object: 1 }, { unique: true });
const Like = mongoose.model('Like', likeSchema);
export default Like;
