const express = require('express');
const jwt = require('jsonwebtoken');
const Document = require('../models/Document');

const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Get all documents for user
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ $or: [{ owner: req.user.userId }, { collaborators: req.user.userId }] });
    res.json(documents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create new document
router.post('/', auth, async (req, res) => {
  try {
    const { title } = req.body;
    const document = new Document({ title, owner: req.user.userId });
    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get document by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || (!document.owner.equals(req.user.userId) && !document.collaborators.includes(req.user.userId))) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update document
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document || (!document.owner.equals(req.user.userId) && !document.collaborators.includes(req.user.userId))) {
      return res.status(404).json({ error: 'Document not found' });
    }
    document.versions.push({ content: document.content, user: req.user.userId });
    document.content = content;
    document.updatedAt = Date.now();
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Revert to version
router.post('/:id/revert/:versionIndex', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || (!document.owner.equals(req.user.userId) && !document.collaborators.includes(req.user.userId))) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const versionIndex = parseInt(req.params.versionIndex);
    if (versionIndex < 0 || versionIndex >= document.versions.length) {
      return res.status(400).json({ error: 'Invalid version index' });
    }
    document.versions.push({ content: document.content, user: req.user.userId });
    document.content = document.versions[versionIndex].content;
    document.updatedAt = Date.now();
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;