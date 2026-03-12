import mongoose from 'mongoose';
const villageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
  
  // Array of Subagents for this specific village
  subagents: [{
    username: { type: String, required: true },
    password: { type: String, required: true },
    token:{ type: String, unique: true },
    name: { type: String },
    phone: { type: String },
    count: { type: Number, default: 0 } 
  }]
});

// Compound index for super-fast searches
villageSchema.index({ mandalId: 1, name: 1 });

export const Village = mongoose.model('Village', villageSchema);