const express = require('express');
const Document = require('../models/Document');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Get all documents for the user
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [{ owner: req.user.userId }, { collaborators: req.user.userId }]
    }).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new document
router.post('/', async (req, res) => {
  try {
    const { id, title } = req.body;
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

// Get a specific document
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

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

// Share a document
router.post('/:id/share', async (req, res) => {
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

module.exports = router;
