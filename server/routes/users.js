const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// GET /api/users  — list all users (for assigning tasks / adding members)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('name');
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
