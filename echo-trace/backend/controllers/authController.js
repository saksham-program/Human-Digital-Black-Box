const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readJson, writeJson } = require('./storage');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// In-memory session store (demo only)
const sessions = new Map(); // token -> { userId, createdAt }

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function signup(req, res) {
  const { name, email, password, emergencyContact } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, message: 'Name, email and password are required.' });
  }

  const users = readJson(USERS_FILE, []);
  const existing = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ ok: false, message: 'Email already registered.' });
  }

  const user = {
    id: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password), // demo: plain text (do NOT use in real apps)
    emergencyContact: emergencyContact ? String(emergencyContact).trim() : '',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJson(USERS_FILE, users);

  return res.json({ ok: true, user: sanitizeUser(user) });
}

function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' });
  }

  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.email === String(email).trim().toLowerCase());
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ ok: false, message: 'Invalid email or password.' });
  }

  const token = uuidv4();
  sessions.set(token, { userId: user.id, createdAt: Date.now() });

  return res.json({ ok: true, token, user: sanitizeUser(user) });
}

function logout(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (token) sessions.delete(token);
  return res.json({ ok: true });
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ ok: false, message: 'Not authenticated.' });
  }
  req.session = sessions.get(token);
  next();
}

function me(req, res) {
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found.' });
  return res.json({ ok: true, user: sanitizeUser(user) });
}

module.exports = { signup, login, logout, requireAuth, me };
