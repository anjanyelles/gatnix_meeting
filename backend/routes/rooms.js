const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const activeUsers = {}; // Track active users in rooms

// Get active rooms with user count
router.get('/status', authenticateToken, async (req, res) => {
  const rooms = {
    'Resume Team': 0,
    'Technical Recruiter Team': 0,
    'Tea Break': 0,
    'Lunch Break': 0
  };
  
  Object.keys(activeUsers).forEach(room => {
    if (rooms.hasOwnProperty(room)) {
      rooms[room] = activeUsers[room].length;
    }
  });
  
  res.json(rooms);
});

// Log join/leave events
router.post('/log', authenticateToken, async (req, res) => {
  const { room_name, action } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO room_logs (user_id, room_name, action) VALUES ($1, $2, $3)',
      [req.user.id, room_name, action]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Logging error' });
  }
});

module.exports = router;