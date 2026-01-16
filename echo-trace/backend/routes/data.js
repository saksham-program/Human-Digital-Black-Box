const express = require('express');
const { requireAuth } = require('../controllers/authController');
const data = require('../controllers/dataController');

const router = express.Router();

router.get('/dashboard', requireAuth, data.getDashboard);
router.get('/health', requireAuth, data.getHealthSeries);
router.get('/stats', requireAuth, data.getStatsCharts);
router.get('/timeline', requireAuth, data.getTimeline);
router.post('/sos', requireAuth, data.postSOS);
router.get('/locations', requireAuth, data.getLocations);

router.get('/contacts', requireAuth, data.getContacts);
router.post('/contacts', requireAuth, data.addContact);
router.put('/contacts/:id', requireAuth, data.updateContact);
router.delete('/contacts/:id', requireAuth, data.deleteContact);

router.get('/privacy', requireAuth, data.getPrivacy);
router.put('/privacy', requireAuth, data.updatePrivacy);

module.exports = router;
