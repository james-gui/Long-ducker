const express = require('express');
const router = express.Router();
const Duck = require('../models/duck');
const Bid = require('../models/bid');

// Duck routes
router.get('/', async (req, res) => {
  try {
    const ducks = await Duck.find();
    res.json(ducks);
  } catch (err) {
    console.error('Error fetching ducks:', err);
    res.status(500).json({ message: 'Error fetching ducks: ' + err.message });
  }
});

// Bid routes
router.get('/api/bids', async (req, res) => {
  try {
    const bids = await Bid.find();
    res.json(bids);
  } catch (err) {
    console.error('Error fetching bids:', err);
    res.status(500).json({ message: 'Error fetching bids: ' + err.message });
  }
});

// Admin routes
router.post('/admin/add-duck', async (req, res) => {
  try {
    const newDuck = new Duck(req.body);
    const savedDuck = await newDuck.save();
    res.status(201).json(savedDuck);
  } catch (err) {
    console.error('Error creating duck:', err);
    res.status(400).json({ message: 'Error creating duck: ' + err.message });
  }
});

module.exports = router;