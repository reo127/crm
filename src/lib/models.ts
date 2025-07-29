
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Won'], 
    default: 'New' 
  },
  dateOfCall: { type: Date },
  lastCallDate: { type: Date },
  notes: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
