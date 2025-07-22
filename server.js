const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '30mb' })); // Increase the limit to handle larger Base64 strings
app.use(express.static('public'));

// In-memory array to store auctions
let auctions = [
  { 
    id: 1,
    title: "Vintage Rolex Watch", 
    description: "A rare 1956 Rolex Submariner in excellent condition. This timepiece features a black dial, luminous hour markers, and a rotating bezel. It comes with its original box and papers, making it a true collector's item.", 
    currentBid: 15000,
    image: "https://cdn.glitch.global/05568431-9cb3-4705-b7c2-a953f7c82317/rolex.jpg?v=1726446219206"
  },
  { 
    id: 2,
    title: "Original Banksy Artwork", 
    description: "An authenticated Banksy piece from his early street art days. This piece, titled 'Girl with Balloon', showcases Banksy's iconic stencil technique and powerful imagery. It comes with a certificate of authenticity.", 
    currentBid: 50000,
    image: "https://cdn.glitch.global/05568431-9cb3-4705-b7c2-a953f7c82317/art.jpg?v=1726470464647"
  },
  { 
    id: 3,
    title: "First Edition Harry Potter Book", 
    description: "First edition, first printing of Harry Potter and the Philosopher's Stone, signed by J.K. Rowling. This rare book is in excellent condition and is a must-have for any serious Harry Potter collector.", 
    currentBid: 75000,
    image: "https://cdn.glitch.global/05568431-9cb3-4705-b7c2-a953f7c82317/harrypotter.jpg?v=1726470497554"
  },
  { 
    id: 4,
    title: "1965 Fender Stratocaster", 
    description: "A classic 1965 Fender Stratocaster in sunburst finish. This guitar is in excellent playing condition and has been professionally set up. It features the original pickups and hardware, producing that iconic Strat tone.", 
    currentBid: 25000,
    image: "https://cdn.glitch.global/05568431-9cb3-4705-b7c2-a953f7c82317/guiter.jpg?v=1726470505450"
  },
  { 
    id: 5,
    title: "Rare Blue Diamond", 
    description: "A 5-carat blue diamond, certified by GIA. This extremely rare and valuable diamond has a vivid blue color and excellent clarity. It comes with its GIA certificate and a custom-made presentation box.", 
    currentBid: 1000000,
    image: "https://cdn.glitch.global/05568431-9cb3-4705-b7c2-a953f7c82317/rarediamond.jpg?v=1726470509512"
  },
  { 
    id: 6,
    title: "Bat Car", 
    description: "I am batman.", 
    currentBid: 10000000,
    image: "https://cdn.glitch.global/05568431-9cb3-4705-b7c2-a953f7c82317/batcar.jpg?v=1726471192775"
  }
];

// Add a bids array to each auction item
auctions = auctions.map(auction => ({
  ...auction,
  bids: []
}));

// Simple in-memory session storage
const sessions = {};

// Admin credentials
const adminCredentials = {
  username: 'admin',
  password: 'sinister123'
};

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (username !== adminCredentials.username) {
    return res.status(401).json({ error: "Invalid username." });
  }

  if (password !== adminCredentials.password) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  const sessionId = Math.random().toString(36).substring(2);
  sessions[sessionId] = { username: adminCredentials.username };
  res.json({ sessionId });
});

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  const sessionId = req.get('Authorization');
  if (sessions[sessionId]) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

 // public routes

// GET all auctions
app.get('/auctions', (req, res) => {
  res.json(auctions);
});

// POST a new auction (public)
app.post('/auctions', (req, res) => {
  const { title, description, currentBid, image } = req.body;
  const newAuction = {
    id: auctions.length + 1,
    title,
    description,
    currentBid: parseFloat(currentBid), 
    image
  };
  auctions.push(newAuction);
  res.status(201).json(newAuction);
});

// GET a specific auction with all its bids
app.get('/auctions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const auction = auctions.find(a => a.id === id);
  if (auction) {
    res.json(auction);
  } else {
    res.status(404).json({ error: "Auction not found" });
  }
});

// PUT (update) an auction (public)
app.put('/auctions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { currentBid, bidderName } = req.body;
  const auction = auctions.find(a => a.id === id);
  
  if (auction) {
    const newBid = parseFloat(currentBid);
    
    // Check if the new bid is higher than the current bid
    if (newBid > auction.currentBid) {
      auction.currentBid = newBid;
      auction.highestBidder = bidderName;
      auction.bids.push({ bidder: bidderName, amount: newBid, time: new Date() });
      res.json(auction);
    } else {
      res.status(400).json({ error: "New bid must be higher than the current bid" });
    }
  } else {
    res.status(404).json({ error: "Auction not found" });
  }
});

// Admin routes (protected)

// Serve admin.html only if logged in
app.get('/admin.html', requireLogin, (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

// GET all auctions with bids (admin only)
app.get('/admin/auctions', requireLogin, (req, res) => {
  res.json(auctions);
});

// POST a new auction (admin only)
app.post('/admin/auctions', requireLogin, (req, res) => {
  const { title, description, currentBid, image } = req.body;
  const newAuction = {
    id: auctions.length + 1,
    title,
    description,
    currentBid: parseFloat(currentBid),
    image,
    bids: []
  };
  auctions.push(newAuction);
  res.status(201).json(newAuction);
});

app.post('/logout', (req, res) => {
  const sessionId = req.get('Authorization');
  delete sessions[sessionId];
  res.json({ success: true });
});


// GET a specific auction with all its bids (admin only)
app.get('/admin/auctions/:id', requireLogin, (req, res) => {
  const id = parseInt(req.params.id);
  const auction = auctions.find(a => a.id === id);
  if (auction) {
    res.json(auction);
  } else {
    res.status(404).json({ error: "Auction not found" });
  }
});
// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
