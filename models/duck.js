// models/duck.js
const mongoose = require('mongoose');

const duckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String, // URLs to image files
    required: true
  }],
  active: {
    type: Boolean,
    default: true
  },
  auctionStart: {
    type: Date,
    required: true
  },
  auctionEnd: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a method to check if auction is currently active
duckSchema.methods.isAuctionActive = function() {
  const now = new Date();
  return this.active && 
         now >= this.auctionStart && 
         now <= this.auctionEnd;
};

// Add a method to get auction status text
duckSchema.methods.getAuctionStatus = function() {
  const now = new Date();
  
  if (!this.active) {
    return "inactive";
  } else if (now < this.auctionStart) {
    return "upcoming";
  } else if (now > this.auctionEnd) {
    return "ended";
  } else {
    return "active";
  }
};

module.exports = mongoose.model('Duck', duckSchema);