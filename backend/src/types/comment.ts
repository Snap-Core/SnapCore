import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  inReplyTo: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'], required: false },
  createdAt: { type: Date, default: Date.now },
  actor: { type: String, required: true },
  activityPubObject: { type: Object },
});

export default mongoose.model('Comment', CommentSchema);
