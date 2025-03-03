const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  duckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Duck',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  agreementConfirmed: {
    type: Boolean,
    required: true,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Static method to get highest bid for a specific duck
bidSchema.statics.getHighestBid = async function(duckId) {
  return this.findOne({ duckId: duckId }).sort({ amount: -1 });
};

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;