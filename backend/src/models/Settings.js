// backend/src/models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
