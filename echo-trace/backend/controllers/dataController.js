const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readJson, writeJson } = require('./storage');

const APP_FILE = path.join(__dirname, '..', 'data', 'app.json');

function initUserBuckets(app, userId) {
  if (!app.contacts[userId]) {
    app.contacts[userId] = [
      { id: uuidv4(), name: 'Mom', phone: '+91 98765 43210', relationship: 'Mother' },
      { id: uuidv4(), name: 'Dad', phone: '+91 98765 43211', relationship: 'Father' }
    ];
  }
  if (!app.privacy[userId]) {
    app.privacy[userId] = {
      healthSharing: true,
      locationSharing: true,
      bluetooth: true,
      locationServices: true,
      callAccess: true,
      smsAccess: true,
      blockchainSecurity: true
    };
  }
}

function nowIso() {
  return new Date().toISOString();
}

function addTimeline(app, userId, item) {
  app.timeline.push({
    id: uuidv4(),
    userId,
    createdAt: nowIso(),
    ...item
  });
}

function getDashboard(req, res) {
  const userId = req.session.userId;
  // realistic mock sensor snapshot
  const hr = 68 + Math.floor(Math.random() * 12); // 68-79
  const spo2 = 96 + Math.floor(Math.random() * 4); // 96-99
  const temp = (36.4 + Math.random() * 0.8).toFixed(1);
  const stressLevels = ['Low', 'Medium', 'High'];
  const stress = stressLevels[Math.floor(Math.random() * stressLevels.length)];
  const sleep = (6.5 + Math.random() * 2.2).toFixed(1);

  return res.json({
    ok: true,
    stats: {
      heartRate: hr,
      oxygen: spo2,
      temperatureC: Number(temp),
      stress,
      sleepHours: Number(sleep),
      safetyStatus: 'All systems active'
    },
    device: {
      watchConnected: true,
      crashDetection: true
    }
  });
}

function getHealthSeries(req, res) {
  // Return arrays for charts.
  // Heart rate: last 6 hours, hourly points
  const labels6h = ['-6h','-5h','-4h','-3h','-2h','-1h','Now'];
  const hr = labels6h.map((_, i) => 70 + Math.round(8 * Math.sin(i/2) + (Math.random()*6-3)));

  // Stress: last 24h, 8 points (every 3 hours)
  const labels24h = ['-24h','-21h','-18h','-15h','-12h','-9h','-6h','-3h','Now'];
  const stress = labels24h.map((_, i) => {
    const base = 4 + 2*Math.sin(i/1.3);
    return Math.max(1, Math.min(10, Math.round(base + (Math.random()*2-1) + (i>5?1:0))));
  });

  // Sleep: last 7 days
  const labels7d = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const sleep = labels7d.map((_, i) => Number((6.8 + 0.9*Math.sin(i/1.1) + (Math.random()*0.6-0.3)).toFixed(1)));

  return res.json({ ok: true, series: { labels6h, hr, labels24h, stress, labels7d, sleep } });
}

function getStatsCharts(req, res) {
  // Safety score: last 30 days
  const labels30 = Array.from({ length: 30 }, (_, i) => `Day ${i+1}`);
  const safety = labels30.map((_, i) => {
    const trend = 72 + 8*Math.sin(i/4);
    return Math.max(40, Math.min(95, Math.round(trend + (Math.random()*6-3))));
  });

  // Weekly activity: 7 days
  const labels7 = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const activity = labels7.map((_, i) => Math.max(10, Math.min(100, Math.round(55 + 25*Math.sin((i+1)/1.4) + (Math.random()*10-5)))));

  return res.json({ ok: true, charts: { labels30, safety, labels7, activity } });
}

function getTimeline(req, res) {
  const userId = req.session.userId;
  const filter = (req.query.filter || '24h').toString();

  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);

  const now = Date.now();
  const windowMs = filter === '7d' ? 7*24*60*60*1000 : 24*60*60*1000;

  const items = app.timeline
    .filter(t => t.userId === userId)
    .filter(t => (now - Date.parse(t.createdAt)) <= windowMs)
    .sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return res.json({ ok: true, items });
}

function postSOS(req, res) {
  const userId = req.session.userId;
  const { location } = req.body || {};

  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);

  const sosEvent = {
    id: uuidv4(),
    userId,
    createdAt: nowIso(),
    status: 'Emergency Protocol Activated',
    location: location || { lat: 19.0760, lng: 72.8777, label: 'Mumbai Central, Maharashtra, India' }
  };

  app.sos.push(sosEvent);

  addTimeline(app, userId, {
    type: 'sos',
    title: 'SOS Triggered',
    details: `Emergency protocol activated. Location: ${sosEvent.location.label}`
  });

  writeJson(APP_FILE, app);
  return res.json({ ok: true, sos: sosEvent });
}

function getLocations(req, res) {
  // Demo location history
  const points = [
    { time: '15:42', lat: 19.0760, lng: 72.8777, label: 'Mumbai Central, Maharashtra, India' },
    { time: '14:30', lat: 19.0596, lng: 72.8295, label: 'Bandra West, Mumbai' },
    { time: '13:15', lat: 19.0990, lng: 72.8258, label: 'Juhu Beach, Mumbai' },
    { time: '12:00', lat: 19.1136, lng: 72.8697, label: 'Home Location (Andheri), Mumbai' }
  ];
  return res.json({ ok: true, current: points[0], history: points });
}

function getContacts(req, res) {
  const userId = req.session.userId;
  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);
  writeJson(APP_FILE, app);
  return res.json({ ok: true, contacts: app.contacts[userId] });
}

function addContact(req, res) {
  const userId = req.session.userId;
  const { name, phone, relationship } = req.body || {};
  if (!name || !phone) return res.status(400).json({ ok: false, message: 'Name and phone are required.' });

  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);

  const contact = { id: uuidv4(), name: String(name).trim(), phone: String(phone).trim(), relationship: relationship ? String(relationship).trim() : '' };
  app.contacts[userId].push(contact);

  addTimeline(app, userId, { type: 'contact', title: 'Trusted Contact Added', details: `${contact.name} (${contact.phone}) added.` });

  writeJson(APP_FILE, app);
  return res.json({ ok: true, contact });
}

function updateContact(req, res) {
  const userId = req.session.userId;
  const id = req.params.id;
  const { name, phone, relationship } = req.body || {};

  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);

  const idx = app.contacts[userId].findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'Contact not found.' });

  app.contacts[userId][idx] = {
    ...app.contacts[userId][idx],
    name: name !== undefined ? String(name).trim() : app.contacts[userId][idx].name,
    phone: phone !== undefined ? String(phone).trim() : app.contacts[userId][idx].phone,
    relationship: relationship !== undefined ? String(relationship).trim() : app.contacts[userId][idx].relationship
  };

  addTimeline(app, userId, { type: 'contact', title: 'Trusted Contact Updated', details: `${app.contacts[userId][idx].name} updated.` });

  writeJson(APP_FILE, app);
  return res.json({ ok: true, contact: app.contacts[userId][idx] });
}

function deleteContact(req, res) {
  const userId = req.session.userId;
  const id = req.params.id;

  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);

  const contact = app.contacts[userId].find(c => c.id === id);
  if (!contact) return res.status(404).json({ ok: false, message: 'Contact not found.' });

  app.contacts[userId] = app.contacts[userId].filter(c => c.id !== id);
  addTimeline(app, userId, { type: 'contact', title: 'Trusted Contact Deleted', details: `${contact.name} removed.` });

  writeJson(APP_FILE, app);
  return res.json({ ok: true });
}

function getPrivacy(req, res) {
  const userId = req.session.userId;
  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);
  writeJson(APP_FILE, app);
  return res.json({ ok: true, privacy: app.privacy[userId] });
}

function updatePrivacy(req, res) {
  const userId = req.session.userId;
  const updates = req.body || {};

  const app = readJson(APP_FILE, { timeline: [], sos: [], contacts: {}, privacy: {} });
  initUserBuckets(app, userId);

  app.privacy[userId] = { ...app.privacy[userId], ...updates };
  addTimeline(app, userId, { type: 'privacy', title: 'Privacy Settings Updated', details: 'User updated privacy toggles.' });

  writeJson(APP_FILE, app);
  return res.json({ ok: true, privacy: app.privacy[userId] });
}

module.exports = {
  getDashboard,
  getHealthSeries,
  getStatsCharts,
  getTimeline,
  postSOS,
  getLocations,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  getPrivacy,
  updatePrivacy
};
