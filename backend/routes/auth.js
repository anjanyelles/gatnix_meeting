const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, team } = req.body;
  
  if (!['Resume', 'Technical Recruiter'].includes(team)) {
    return res.status(400).json({ error: 'Invalid team' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, team) VALUES ($1, $2, $3) RETURNING id, email, team',
      [email, hashedPassword, team]
    );
    res.json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.detail || 'User already exists' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });
    
    const token = jwt.sign({ id: user.id, email: user.email, team: user.team }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, team: user.team } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;