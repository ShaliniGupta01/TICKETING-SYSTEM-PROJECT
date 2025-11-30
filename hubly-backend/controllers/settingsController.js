const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json(settings);
};

exports.updateSettings = async (req, res) => {
  const payload = req.body;
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(payload);
  } else {
    Object.assign(settings, payload);
    settings.updatedAt = Date.now();
    await settings.save();
  }
  res.json(settings);
};
