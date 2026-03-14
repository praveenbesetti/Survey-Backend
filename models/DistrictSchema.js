import mongoose from 'mongoose';
const districtSchema = new mongoose.Schema({
  stateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'State', 
        required: true,
        index: true
    },
  name: { type: String, required: true, unique: true },
  state: { type: String, default: "Andhra Pradesh" }
});

export const District = mongoose.model('District', districtSchema);