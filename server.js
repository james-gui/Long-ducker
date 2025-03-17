// Server.js - Complete file with time constraint modifications
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const basicAuth = require('express-basic-auth');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    
    if (ext && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Basic authentication for admin routes
const adminAuth = basicAuth({
  users: { 'admin': process.env.adminpassword }, // Change this in production!
  challenge: true,
  realm: 'Duck Auction Admin'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname + '/public/'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// MongoDB connection (optional)
// If not using MongoDB, comment this out or wrap in a conditional
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    
    // Import routes AFTER connection is established
    // This ensures models are imported when the DB is connected    
    // Use routes    
    // Start server
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import MongoDB models (if using MongoDB)
//const Duck = mongoose.connection.readyState === 1 ? require('./models/duck') : null;
//const Bid = mongoose.connection.readyState === 1 ? require('./models/bid') : null;




// In-memory storage (if not using MongoDB)
//const ducks = [];
//const bids = [];

// Routes

// Get all ducks

//importing models!
const Duck = require('./models/duck');
const Bid = require('./models/bid');

app.get('/api/ducks', async (req, res) => {
  try {
    let ducksData;
    
    if (mongoose.connection.readyState === 1) {
      ducksData = await Duck.find({ active: true }).sort({ createdAt: -1 });
    } else {
      ducksData = ducks.filter(d => d.active).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    res.json(ducksData);
  } catch (error) {
    console.error('Error fetching ducks:', error);
    res.status(500).json({ error: 'Failed to fetch ducks' });
  }
});

// Get single duck
app.get('/api/ducks/:id', async (req, res) => {
  try {
    const duckId = req.params.id;
    let duck;
    
    if (mongoose.connection.readyState === 1) {
      duck = await Duck.findById(duckId);
    } else {
      duck = ducks.find(d => d.id === duckId);
    }
    
    if (!duck) {
      return res.status(404).json({ error: 'Duck not found' });
    }
    
    res.json(duck);
  } catch (error) {
    console.error('Error fetching duck:', error);
    res.status(500).json({ error: 'Failed to fetch duck' });
  }
});

// Admin: Get all ducks (including inactive)
app.get('/api/admin/ducks', adminAuth, async (req, res) => {
  try {
    let ducksData;
    
    if (mongoose.connection.readyState === 1) {
      ducksData = await Duck.find().sort({ createdAt: -1 });
    } else {
      ducksData = [...ducks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    res.json(ducksData);
  } catch (error) {
    console.error('Error fetching ducks for admin:', error);
    res.status(500).json({ error: 'Failed to fetch ducks' });
  }
});

// Admin: Create new duck
app.post('/api/admin/ducks', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, startingBid, active, auctionStart, auctionEnd } = req.body;
    
    // Validate required fields
    if (!name || !description || !startingBid || !auctionStart || !auctionEnd) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one image' });
    }
    
    // Validate time constraints
    const startTime = new Date(auctionStart);
    const endTime = new Date(auctionEnd);
    
    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    
    if (mongoose.connection.readyState === 1) {
      const newDuck = new Duck({
        name,
        description,
        startingBid: parseFloat(startingBid),
        images: imageUrls,
        active: active === 'true' || active === true,
        auctionStart: startTime,
        auctionEnd: endTime
      });
      
      await newDuck.save();
      res.status(201).json(newDuck);
    } else {
      // In-memory storage
      const newDuck = {
        id: uuidv4(),
        name,
        description,
        startingBid: parseFloat(startingBid),
        images: imageUrls,
        active: active === 'true' || active === true,
        auctionStart: startTime,
        auctionEnd: endTime,
        createdAt: new Date()
      };
      
      ducks.push(newDuck);
      res.status(201).json(newDuck);
    }
  } catch (error) {
    console.error('Error creating duck:', error);
    res.status(500).json({ error: 'Failed to create duck' });
  }
});

// Admin: Update duck
app.put('/api/admin/ducks/:id', adminAuth, upload.array('newImages', 5), async (req, res) => {
  try {
    const { name, description, startingBid, active, existingImages, auctionStart, auctionEnd } = req.body;
    const duckId = req.params.id;
    
    // Validate required fields
    if (!name || !description || !startingBid || !auctionStart || !auctionEnd) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    // Validate time constraints
    const startTime = new Date(auctionStart);
    const endTime = new Date(auctionEnd);
    
    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Process images
    let imageUrls = [];
    
    // Add existing images that weren't deleted
    if (existingImages) {
      if (typeof existingImages === 'string') {
        imageUrls.push(existingImages);
      } else if (Array.isArray(existingImages)) {
        imageUrls = [...existingImages];
      }
    }
    
    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/uploads/${file.filename}`);
      imageUrls = [...imageUrls, ...newImageUrls];
    }
    
    if (imageUrls.length === 0) {
      return res.status(400).json({ error: 'Please include at least one image' });
    }
    
    if (mongoose.connection.readyState === 1) {
      const updatedDuck = await Duck.findByIdAndUpdate(
        duckId,
        {
          name,
          description,
          startingBid: parseFloat(startingBid),
          images: imageUrls,
          active: active === 'true' || active === true,
          auctionStart: startTime,
          auctionEnd: endTime
        },
        { new: true }
      );
      
      if (!updatedDuck) {
        return res.status(404).json({ error: 'Duck not found' });
      }
      
      res.json(updatedDuck);
    } else {
      // In-memory storage
      const duckIndex = ducks.findIndex(d => d.id === duckId);
      
      if (duckIndex === -1) {
        return res.status(404).json({ error: 'Duck not found' });
      }
      
      ducks[duckIndex] = {
        ...ducks[duckIndex],
        name,
        description,
        startingBid: parseFloat(startingBid),
        images: imageUrls,
        active: active === 'true' || active === true,
        auctionStart: startTime,
        auctionEnd: endTime
      };
      
      res.json(ducks[duckIndex]);
    }
  } catch (error) {
    console.error('Error updating duck:', error);
    res.status(500).json({ error: 'Failed to update duck' });
  }
});

// Admin: Delete duck
app.delete('/api/admin/ducks/:id', adminAuth, async (req, res) => {
  try {
    const duckId = req.params.id;
    
    if (mongoose.connection.readyState === 1) {
      const result = await Duck.findByIdAndDelete(duckId);
      
      if (!result) {
        return res.status(404).json({ error: 'Duck not found' });
      }
    } else {
      const duckIndex = ducks.findIndex(d => d.id === duckId);
      
      if (duckIndex === -1) {
        return res.status(404).json({ error: 'Duck not found' });
      }
      
      ducks.splice(duckIndex, 1);
    }
    
    res.json({ message: 'Duck removed successfully' });
  } catch (error) {
    console.error('Error deleting duck:', error);
    res.status(500).json({ error: 'Failed to delete duck' });
  }
});

// Admin: Get all bids
app.get('/api/admin/bids', adminAuth, async (req, res) => {
  try {
    let bidsData;
    
    if (mongoose.connection.readyState === 1) {
      bidsData = await Bid.find().populate('duckId').sort({ timestamp: -1 });
    } else {
      // In-memory approach with join-like functionality
      bidsData = bids.map(bid => {
        const duck = ducks.find(d => d.id === bid.duckId);
        return {
          ...bid,
          duckId: duck || { name: 'Unknown Duck' }
        };
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    res.json(bidsData);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Admin: Get bids for a specific duck
app.get('/api/admin/bids/:duckId', adminAuth, async (req, res) => {
  try {
    const duckId = req.params.duckId;
    let duckBids;
    
    if (mongoose.connection.readyState === 1) {
      duckBids = await Bid.find({ duckId }).sort({ amount: -1 });
    } else {
      duckBids = bids.filter(b => b.duckId === duckId).sort((a, b) => b.amount - a.amount);
    }
    
    res.json(duckBids);
  } catch (error) {
    console.error('Error fetching duck bids:', error);
    res.status(500).json({ error: 'Failed to fetch duck bids' });
  }
});

// Admin: Get highest bids for all ducks
app.get('/api/admin/highest-bids', adminAuth, async (req, res) => {
  try {
    let highestBids = {};
    
    if (mongoose.connection.readyState === 1) {
      // For MongoDB, use aggregation to get highest bid per duck
      const results = await Bid.aggregate([
        {
          $group: {
            _id: '$duckId',
            amount: { $max: '$amount' },
            bidId: { $last: '$_id' }
          }
        }
      ]);
      
      // Get additional bidder details for each highest bid
      for (const result of results) {
        const bid = await Bid.findById(result.bidId);
        if (bid) {
          highestBids[result._id.toString()] = {
            amount: bid.amount,
            bidderName: bid.fullName,
            timestamp: bid.timestamp
          };
        }
      }
    } else {
      // For in-memory storage
      const duckIds = [...new Set(bids.map(b => b.duckId))];
      
      duckIds.forEach(duckId => {
        const duckBids = bids.filter(b => b.duckId === duckId);
        if (duckBids.length > 0) {
          const highestBid = duckBids.reduce((prev, current) => 
            (prev.amount > current.amount) ? prev : current
          );
          
          highestBids[duckId] = {
            amount: highestBid.amount,
            bidderName: highestBid.fullName,
            timestamp: highestBid.timestamp
          };
        }
      });
    }
    
    res.json(highestBids);
  } catch (error) {
    console.error('Error fetching highest bids:', error);
    res.status(500).json({ error: 'Failed to fetch highest bids' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/duck/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'duck.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/manage-ducks', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage-ducks.html'));
});

app.get('/admin/add-duck', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'add-duck.html'));
});

app.get('/admin/edit-duck/:id', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-duck.html'));
});

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Handle joining a duck's room
  socket.on('joinDuckRoom', (duckId) => {
    socket.join(duckId);
    console.log(`User joined room for duck: ${duckId}`);
    
    // Send current highest bid to the client
    sendCurrentBid(duckId);
  });
  
  // Handle new bids - UPDATED with time constraint checks
  socket.on('newBid', async (bidData) => {
    try {
      const { duckId, fullName, email, phoneNumber, amount, agreementConfirmed } = bidData;
      
      // Basic validation
      if (!duckId || !fullName || !email || !phoneNumber || !amount) {
        socket.emit('bidError', { message: 'Please fill in all required fields!' });
        return;
      }
      
      if (!agreementConfirmed) {
        socket.emit('bidError', { message: 'You must agree to the terms and conditions!' });
        return;
      }
      
      // Validate if duck exists
      let duck;
      if (mongoose.connection.readyState === 1) {
        duck = await Duck.findById(duckId);
        if (!duck) {
          socket.emit('bidError', { message: 'Duck not found!' });
          return;
        }
        
        // Check if auction is active based on time constraints
        const now = new Date();
        if (!duck.active) {
          socket.emit('bidError', { message: 'This auction is no longer active!' });
          return;
        }
        
        if (now < duck.auctionStart) {
          socket.emit('bidError', { 
            message: `This auction hasn't started yet! It will begin on ${duck.auctionStart.toLocaleString()}` 
          });
          return;
        }
        
        if (now > duck.auctionEnd) {
          socket.emit('bidError', { 
            message: `This auction has ended! It closed on ${duck.auctionEnd.toLocaleString()}` 
          });
          return;
        }
        
        // Get current highest bid for this duck
        const highestBid = await Bid.findOne({ duckId: duckId }).sort({ amount: -1 });
        
        // Validate bid amount
        const currentHighestAmount = highestBid ? highestBid.amount : duck.startingBid;
        if (amount <= currentHighestAmount) {
          socket.emit('bidError', { 
            message: `Your bid must be higher than the current highest bid: HK$${currentHighestAmount}` 
          });
          return;
        }
        
        // Create new bid
        const newBid = new Bid({
          duckId,
          fullName,
          email,
          phoneNumber,
          amount,
          agreementConfirmed,
          timestamp: new Date()
        });
        
        await newBid.save();
        
        // Send confirmation to bidder
        socket.emit('bidSuccess', { 
          message: `Your bid of HK$${amount} has been placed successfully!` 
        });
        
        // Update all clients about the new bid
        io.to(duckId).emit('currentBid', {
          duckId,
          amount,
          bidder: maskBidderName(fullName)
        });
        
      } else {
        // In-memory storage approach
        duck = ducks.find(d => d.id === duckId);
        if (!duck) {
          socket.emit('bidError', { message: 'Duck not found!' });
          return;
        }
        
        // Check time constraints for in-memory approach
        const now = new Date();
        if (!duck.active) {
          socket.emit('bidError', { message: 'This auction is no longer active!' });
          return;
        }
        
        if (now < new Date(duck.auctionStart)) {
          socket.emit('bidError', { 
            message: `This auction hasn't started yet! It will begin on ${new Date(duck.auctionStart).toLocaleString()}` 
          });
          return;
        }
        
        if (now > new Date(duck.auctionEnd)) {
          socket.emit('bidError', { 
            message: `This auction has ended! It closed on ${new Date(duck.auctionEnd).toLocaleString()}` 
          });
          return;
        }
        
        // Get current highest bid
        const duckBids = bids.filter(b => b.duckId === duckId);
        const highestBid = duckBids.length > 0 
          ? duckBids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) 
          : null;
        
        const currentHighestAmount = highestBid ? highestBid.amount : duck.startingBid;
        if (amount <= currentHighestAmount) {
          socket.emit('bidError', { 
            message: `Your bid must be higher than the current highest bid: HK$${currentHighestAmount}` 
          });
          return;
        }
        
        // Create new bid
        const newBid = {
          id: uuidv4(),
          duckId,
          fullName,
          email,
          phoneNumber,
          amount,
          agreementConfirmed,
          timestamp: new Date()
        };
        
        bids.push(newBid);
        
        // Send confirmation to bidder
        socket.emit('bidSuccess', { 
          message: `Your bid of HK$${amount} has been placed successfully!` 
        });
        
        // Update all clients about the new bid
        io.to(duckId).emit('currentBid', {
          duckId,
          amount,
          bidder: maskBidderName(fullName)
        });
      }
      
      console.log(`New bid placed: ${amount} for duck ${duckId} by ${fullName}`);
      
    } catch (error) {
      console.error('Error handling new bid:', error);
      socket.emit('bidError', { message: 'Server error processing bid. Please try again.' });
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Helper function to send current bid to clients
async function sendCurrentBid(duckId) {
  try {
    if (mongoose.connection.readyState === 1) {
      const highestBid = await Bid.findOne({ duckId }).sort({ amount: -1 });
      const duck = await Duck.findById(duckId);
      
      if (duck) {
        if (highestBid) {
          io.to(duckId).emit('currentBid', {
            duckId,
            amount: highestBid.amount,
            bidder: maskBidderName(highestBid.fullName)
          });
        } else {
          io.to(duckId).emit('currentBid', {
            duckId,
            amount: duck.startingBid,
            bidder: 'No bids yet'
          });
        }
      }
    } else {
      // In-memory approach
      const duck = ducks.find(d => d.id === duckId);
      if (duck) {
        const duckBids = bids.filter(b => b.duckId === duckId);
        
        if (duckBids.length > 0) {
          const highestBid = duckBids.reduce((prev, current) => 
            (prev.amount > current.amount) ? prev : current
          );
          
          io.to(duckId).emit('currentBid', {
            duckId,
            amount: highestBid.amount,
            bidder: maskBidderName(highestBid.fullName)
          });
        } else {
          io.to(duckId).emit('currentBid', {
            duckId,
            amount: duck.startingBid,
            bidder: 'No bids yet'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error sending current bid:', error);
  }
}

// Helper function to mask bidder name for privacy
function maskBidderName(fullName) {
  if (!fullName) return 'Anonymous';
  const names = fullName.trim().split(' ');
  
  if (names.length === 1) {
    return names[0].charAt(0) + '*'.repeat(names[0].length - 1);
  }
  
  const firstName = names[0].charAt(0) + '*'.repeat(names[0].length - 1);
  const lastName = names[names.length - 1].charAt(0) + '*'.repeat(names[names.length - 1].length - 1);
  
  return `${firstName} ${lastName}`;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});