const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const { setupWSConnection } = require('y-websocket/bin/utils');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Document = require('./models/Document');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabwrite';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Use env in prod!

mongoose.connect(MONGODB_URI) // Mongoose 7+ defaults are fine
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENT ROUTES ---
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    // Find docs where user is owner OR collaborator
    // For now, let's just show all for simplicity or owned ones
    const docs = await Document.find({
      $or: [{ owner: req.user.userId }, { collaborators: req.user.userId }]
    }).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    const { id, title } = req.body; // Client can provide ID (uuid)
    const doc = new Document({
      _id: id,
      title: title || 'Untitled',
      owner: req.user.userId
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Check permission
    const isOwner = doc.owner.toString() === req.user.userId;
    const isCollaborator = doc.collaborators.some(id => id.toString() === req.user.userId);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/:id/share', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only owner can share' });
    }

    const userToShare = await User.findOne({ email });
    if (!userToShare) return res.status(404).json({ message: 'User not found' });

    if (doc.collaborators.includes(userToShare._id)) {
      return res.status(400).json({ message: 'User already a collaborator' });
    }

    doc.collaborators.push(userToShare._id);
    await doc.save();

    res.json({ message: 'Document shared', user: { username: userToShare.username, email: userToShare.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Basic Route
app.get('/', (req, res) => {
  res.send('CollabWrite Server is running');
});

// --- YJS WEBSOCKET SETUP ---
const wss = new WebSocket.Server({ noServer: true });

// y-websocket Utils setup
const utils = require('y-websocket/bin/utils');

// Persistence Callback
// Persistence Callback
utils.setPersistence({
  bindState: async (docName, ydoc) => {
    // Determine the document ID
    const docId = docName;
    console.log(`[Persistence] Loading document: ${docId}`);

    try {
      // Load persisted state from MongoDB
      const persistedDoc = await Document.findById(docId);
      if (persistedDoc && persistedDoc.data) {
        console.log(`[Persistence] Document found in DB, applying update. Size: ${persistedDoc.data.length}`);
        const Y = require('yjs');
        // Apply the stored binary update to the Yjs document
        Y.applyUpdate(ydoc, persistedDoc.data);
      } else {
        console.log(`[Persistence] Document not found in DB or empty.`);
      }
    } catch (err) {
      console.error(`[Persistence] Error loading document ${docId}:`, err);
    }
  },
  writeState: async (docName, ydoc) => {
    // This is called periodically or on update
    // We want to save the state to MongoDB
    const docId = docName;
    const Y = require('yjs');

    // Encode the state as a single update
    const update = Y.encodeStateAsUpdate(ydoc);
    console.log(`[Persistence] Saving document: ${docId}, Size: ${update.length}`);

    try {
      await Document.findByIdAndUpdate(docId, {
        data: Buffer.from(update),
        updatedAt: new Date()
      }, { upsert: true });
    } catch (err) {
      console.error(`[Persistence] Error saving document ${docId}:`, err);
    }
  }
});


wss.on('connection', (conn, req, { docName = req.url.slice(1).split('?')[0] } = {}) => {
  setupWSConnection(conn, req, { docName, gc: true });
});

server.on('upgrade', (request, socket, head) => {
  const handleAuth = (ws) => {
    wss.emit('connection', ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
