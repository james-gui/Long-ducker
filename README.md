Rubber Duck Auction
A real-time web application for charitable rubber duck auctions.

Overview
The Rubber Duck Auction platform allows users to browse unique rubber ducks and participate in timed auctions. The application features real-time bidding through Socket.io, responsive design, and a user-friendly interface.

Features
- Browse gallery of unique rubber ducks
- View detailed information about each duck
- Real-time bidding system
- Auction countdowns for active and upcoming auctions
- Responsive design for all devices
Technologies Used
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Real-time Updates: Socket.io

Installation
1. Clone the repository

git clone https://github.com/james-gui/Long-ducker
cd rubber-duck-auction
2. Install dependencies

npm install
3. Create a .env file in the root directory with the following variables:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/duck-auction
SESSION_SECRET=your_session_secret
4. Start the server

npm start
For development with auto-restart:

npm run dev
5. Access the application at http://localhost:3000

Project Structure
rubber-duck-auction/
├── public/               # Static files
│   ├── css/              # Stylesheets
│   ├── images/           # Images and assets
│   ├── js/               # Client-side JavaScript
│   ├── index.html        # Homepage
│   └── duck.html         # Duck detail page
├── src/                  # Server-side code
│   ├── models/           # Database models
│   ├── routes/           # API and page routes
│   ├── controllers/      # Route controllers
│   └── utils/            # Utility functions
├── server.js             # Application entry point
├── package.json          # Project dependencies
└── README.md             # Project documentation

API Endpoints
- GET /api/ducks - Get all ducks
- GET /api/ducks/:id - Get specific duck details
- POST /api/bids - Place a new bid (Socket.io also used)

Duck Object Structure
{
  id: String,
  name: String,
  description: String,
  images: [String],
  startingBid: Number,
  highestBid: Number,
  highestBidder: String,
  auctionStart: Date,
  auctionEnd: Date,
  active: Boolean
}

Bid Process
1. User views a duck's details page
2. If auction is active, user can submit a bid form
3. Bid must be higher than current highest bid
4. Real-time updates notify all users when new bids are placed
Auction Statuses
- Inactive: Auction disabled by administrator
- Upcoming: Scheduled but not yet started
- Active: Currently running and accepting bids
- Ended: Concluded and no longer accepting bids
Socket.io Events
- joinDuckRoom - Client joins a specific duck's bid room
- newBid - Client places a new bid
- currentBid - Server broadcasts updated bid information
- bidSuccess - Server confirms bid was accepted
- bidError - Server notifies of bid issues

Troubleshooting
MIME Type Errors
If you encounter CSS MIME type errors, ensure your Express static file configuration is correct:

app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

Socket Connection Issues
If real-time bidding isn't working:

Check browser console for connection errors
Verify Socket.io is properly initialized on both client and server
Ensure no firewalls or proxy issues are blocking WebSocket connections
Future Enhancements
User authentication and accounts
Admin dashboard for duck and auction management
Email notifications for bid status
Payment integration for auction winners
Auction history and statistics
License
This project is licensed under the MIT License - see the LICENSE file for details.

Contributors
Your Name - Initial development and design
Acknowledgments
All rubber duck images are for demonstration purposes
Built as a project for charitable fundraising
