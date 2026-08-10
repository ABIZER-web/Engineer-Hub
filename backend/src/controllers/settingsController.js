// backend/src/controllers/settingsController.js
import Settings from '../models/Settings.js';

const DEFAULTS = {
  platformFee: 5,
  minWithdrawal: 100,
  maxUploadMB: 10,
  allowRegistration: true,
  contactEmail: 'admin@engineerhub.in',
  platformName: 'Engineer Hub',
};

export const getAll = async (req, res) => {
  try {
    const docs = await Settings.find();
    const result = { ...DEFAULTS };
    docs.forEach(d => { result[d.key] = d.value; });
    res.json({ success: true, settings: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getByKey = async (req, res) => {
  try {
    const doc = await Settings.findOne({ key: req.params.key });
    const value = doc ? doc.value : (DEFAULTS[req.params.key] ?? null);
    res.json({ success: true, key: req.params.key, value });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPublic = async (_req, res) => {
  try {
    const keys = ['platformName', 'contactEmail'];
    const docs  = await Settings.find({ key: { $in: keys } });
    const result = {};
    keys.forEach(k => { result[k] = DEFAULTS[k]; });
    docs.forEach(d => { result[d.key] = d.value; });
    res.json({ success: true, settings: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const update = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Key is required' });
    const doc = await Settings.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ success: true, setting: doc });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const bulkUpdate = async (req, res) => {
  try {
    const { settings } = req.body; // { key: value, ... }
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings object required' });
    }
    const ops = Object.entries(settings).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { value, updatedBy: req.user._id } },
        upsert: true,
      },
    }));
    await Settings.bulkWrite(ops);
    res.json({ success: true, message: 'Settings updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
