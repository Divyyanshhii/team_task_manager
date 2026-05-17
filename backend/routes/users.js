import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all users for assigning tasks and adding to projects
router.get('/', authenticate, async (req, res) => {
  try {
    // Select only name, email, and ID. Never select passwords.
    const users = await User.find({}, 'name email _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;