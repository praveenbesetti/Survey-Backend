import mongoose from 'mongoose';
const tokenSchema = new mongoose.Schema({
  subagentUsername: { type: String, required: true },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
  
  tokenValue: { type: String, required: true, unique: true },
  isValid: { type: Boolean, default: false }, // Agent updates this to true
  
  // Auto-delete token after 15 minutes to save space
  createdAt: { type: Date, default: Date.now, expires: 900 } 
});

export const Token = mongoose.model('Token', tokenSchema);