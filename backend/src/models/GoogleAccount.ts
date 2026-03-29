import mongoose from 'mongoose';

const googleAccountSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now }
});

export const GoogleAccount = mongoose.model('GoogleAccount', googleAccountSchema);