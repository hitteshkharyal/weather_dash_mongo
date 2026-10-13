const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getSites,
  getSensorCatalog,
  assignSensorsToSite,
  createSite,
  updateSite,
  deleteSite,
  regenerateSiteApiKey,
  assignSitesToUser,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ─── User Management ──────────────────────
router.route('/users').get(getUsers).post(createUser);
router.route('/users/:id').put(updateUser).delete(deleteUser);
router.put('/users/:id/assign-sites', assignSitesToUser);

// ─── Site Management ──────────────────────
router.route('/sites').get(getSites).post(createSite);
router.get('/sensors/catalog', getSensorCatalog);
router.put('/sites/:id/sensors', assignSensorsToSite);
router.route('/sites/:id').put(updateSite).delete(deleteSite);
router.put('/sites/:id/regenerate-key', regenerateSiteApiKey);

module.exports = router;
