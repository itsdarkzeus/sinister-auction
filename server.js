const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Session management (in-memory for now)
const sessions = {};

// Database setup
const db = new sqlite3.Database(':memory:');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS auctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      starting_price REAL,
      current_bid REAL,
      end_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    
  db.run(`CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction_id INTEGER,
      amount REAL,
      bidder_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(auction_id) REFERENCES auctions(id)
  )`);
    
  // Insert sample data
  db.run(`INSERT INTO auctions (title, description, starting_price, current_bid, end_time) 
          VALUES ('Vintage Guitar', 'Beautiful 1960s electric guitar', 500, 500, datetime('now', '+7 days'))`);
  db.run(`INSERT INTO auctions (title, description, starting_price, current_bid, end_time) 
          VALUES ('Antique Watch', 'Gold pocket watch from 1920s', 300, 300, datetime('now', '+5 days'))`);
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes
app.get('/api/auctions', (req, res) => {
  db.all("SELECT * FROM auctions ORDER BY created_at DESC", (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
          return;
      }
      res.json(rows);
  });
});

app.post('/api/auctions', (req, res) => {
  const { title, description, starting_price, end_time } = req.body;
  db.run(`INSERT INTO auctions (title, description, starting_price, current_bid, end_time) 
          VALUES (?, ?, ?, ?, ?)`, 
          [title, description, starting_price, starting_price, end_time], 
          function(err) {
              if (err) {
                  res.status(500).json({ error: err.message });
                  return;
              }
              res.json({ id: this.lastID, message: 'Auction created successfully' });
          });
});

app.post('/api/bids', (req, res) => {
  const { auction_id, amount, bidder_name } = req.body;
    
  // Check if bid is higher than current bid
  db.get("SELECT current_bid FROM auctions WHERE id = ?", [auction_id], (err, row) => {
      if (err || !row) {
          res.status(500).json({ error: 'Auction not found' });
          return;
      }
        
      if (amount <= row.current_bid) {
          res.status(400).json({ error: 'Bid must be higher than current bid' });
          return;
      }
        
      // Place bid
      db.run(`INSERT INTO bids (auction_id, amount, bidder_name) VALUES (?, ?, ?)`,
              [auction_id, amount, bidder_name], function(err) {
                  if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                  }
                    
                  // Update auction current bid
                  db.run(`UPDATE auctions SET current_bid = ? WHERE id = ?`,
                          [amount, auction_id], (err) => {
                              if (err) {
                                  res.status(500).json({ error: err.message });
                                  return;
                              }
                              res.json({ message: 'Bid placed successfully' });
                          });
              });
  });
});

// Login routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
    
  // Simple admin check (replace with proper authentication)
  if (username === 'admin' && password === 'admin123') {
      const sessionId = Math.random().toString(36).substring(7);
      sessions[sessionId] = { username, isAdmin: true };
      res.json({ success: true, sessionId, message: 'Login successful' });
  } else {
      res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;
  delete sessions[sessionId];
  res.json({ message: 'Logged out successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Auction app running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
  console.log(`🌐 API: http://localhost:${PORT}/api/auctions`);
});
