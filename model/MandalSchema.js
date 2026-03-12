import mongoose from 'mongoose';
const mandalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  
  username: { type: String,   },
  password: { type: String, required: true }, // Always hash this with bcrypt
  agentPhone: { type: String}
});

export const Mandal = mongoose.model('Mandal', mandalSchema);