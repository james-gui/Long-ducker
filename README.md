# Duck Auction Real-Time Bidding System

A live auction system for "Ducker Art Trail Ducks" at Long Ducker charity event.

## Features

- Real-time bidding updates using Socket.IO
- Form validation for bids
- User data collection (name, phone, email)
- Agreement confirmation
- Data privacy with masked bidder names
- Responsive design for mobile and desktop

## Installation & Setup

### Prerequisites

- Node.js (v14 or newer)
- MongoDB

### Steps

1. Clone the repository
2. Install dependencies
3. Create a `.env` file in the project root with: PORT=3000
MONGODB_URI=mongodb://localhost:27017/duck-auction
4. Start MongoDB (if running locally)
5. Start the application
6. For development with auto-restart:
7. Access the application at `http://localhost:3000`

## Deployment

For production deployment:

1. Update the `.env` file with your production MongoDB connection string
2. Set up PM2 or a similar process manager:
