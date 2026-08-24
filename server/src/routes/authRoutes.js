import express from 'express';
import crypto from 'crypto';
import { comparePassword } from '../utils/password.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_phrase_here';

// Helper to get or initialize the single agency settings row.
// Mirrors the inline pattern used in settingRoutes.js (avoids the missing
// shared services/settingsService.js module that the old version imported).
const getOrCreateSettings = async (AgencySetting) => {
  let settings = await AgencySetting.findOne();
  if (!settings) {
    settings = await AgencySetting.create({
      logo: null,
      name: null,
      email: null,
      website: null,
      address: null,
      gstNumber: null,
      password: null,
    });
  }
  return settings;
};

// Sign a compact JWT-shaped token using only Node's built-in crypto, so no
// external `jsonwebtoken` dependency is required.
const signToken = (email) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { AgencySetting } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);
    const isMatch = comparePassword(password, settings.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(email);
    res.json({ success: true, token: token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

export default router;