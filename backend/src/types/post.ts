import mongoose from 'mongoose';


const PostSchema = new mongoose.Schema({
  id: { type: String },
  recipient: { type: String },
  content: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'], required: false },
  createdAt: { type: Date, default: Date.now },
  actor: { type: String, required: true },
  activityPubObject: { type: Object }, // for federation
});


export default mongoose.model('Post', PostSchema);
