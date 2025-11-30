const router = require('express').Router();
const Settings = require('../models/Settings');

router.get('/', async (req, res) => {
  const settings = await Settings.find();
  res.json(settings);
});

module.exports = router;
