const User = require('../models/User');
const Site = require('../models/Site');
const Sensor = require('../models/Sensor');
const { SENSOR_CATALOG, SENSOR_TYPES } = require('../constants/sensors');

// ─── USER MANAGEMENT ────────────────────────────────────────────────

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users
 * @access  Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('assignedSites', 'name location')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user (school account)
 * @access  Admin
 */
const createUser = async (req, res) => {
  try {
    const { email, password, name, role, assignedSites } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'user',
      assignedSites: assignedSites || [],
    });

    const populated = await User.findById(user._id).populate(
      'assignedSites',
      'name location'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user (name, role, assignedSites)
 * @access  Admin
 */
const updateUser = async (req, res) => {
  try {
    const { name, role, assignedSites } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (role) updateFields.role = role;
    if (assignedSites) updateFields.assignedSites = assignedSites;

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).populate('assignedSites', 'name location');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete a user
 * @access  Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SITE MANAGEMENT ────────────────────────────────────────────────

/**
 * @route   GET /api/v1/admin/sites
 * @desc    List all sites
 * @access  Admin
 */
const getSites = async (req, res) => {
  try {
    const sites = await Site.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    const sensors = await Sensor.find({ siteId: { $in: sites.map((site) => site._id) } })
      .select('siteId sensorType label status lastPing')
      .lean();
    const sensorsBySite = new Map();
    for (const sensor of sensors) {
      const key = sensor.siteId.toString();
      sensorsBySite.set(key, [...(sensorsBySite.get(key) || []), sensor]);
    }
    const data = sites.map((site) => ({
      ...site.toJSON(),
      sensors: sensorsBySite.get(site._id.toString()) || [],
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/v1/admin/sensors/catalog
 * @desc    List supported environmental sensors
 * @access  Admin
 */
const getSensorCatalog = (_req, res) => {
  res.status(200).json({ success: true, count: SENSOR_CATALOG.length, data: SENSOR_CATALOG });
};

/**
 * @route   PUT /api/v1/admin/sites/:id/sensors
 * @desc    Replace the supported sensors assigned to a site
 * @access  Admin
 */
const assignSensorsToSite = async (req, res) => {
  try {
    const { sensorTypes } = req.body;
    if (!Array.isArray(sensorTypes) || new Set(sensorTypes).size !== sensorTypes.length) {
      return res.status(400).json({
        success: false,
        message: 'sensorTypes must be an array of unique sensor type IDs',
      });
    }

    const invalidTypes = sensorTypes.filter((type) => !SENSOR_TYPES.includes(type));
    if (invalidTypes.length) {
      return res.status(400).json({
        success: false,
        message: `Unsupported sensor types: ${invalidTypes.join(', ')}`,
      });
    }

    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    if (sensorTypes.length) {
      await Sensor.bulkWrite(
        sensorTypes.map((sensorType) => ({
          updateOne: {
            filter: { siteId: site._id, sensorType },
            update: {
              $setOnInsert: {
                siteId: site._id,
                sensorType,
                label: SENSOR_CATALOG.find((item) => item.type === sensorType).name,
              },
            },
            upsert: true,
          },
        }))
      );
    }

    await Sensor.deleteMany({
      siteId: site._id,
      sensorType: { $nin: sensorTypes },
    });

    const sensors = await Sensor.find({ siteId: site._id })
      .select('siteId sensorType label status lastPing')
      .sort('sensorType');
    res.status(200).json({ success: true, count: sensors.length, data: sensors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/v1/admin/sites
 * @desc    Create a new site (IoT installation)
 * @access  Admin
 */
const createSite = async (req, res) => {
  try {
    const { name, description, location } = req.body;

    const site = await Site.create({
      name,
      description,
      location,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   PUT /api/v1/admin/sites/:id
 * @desc    Update site details
 * @access  Admin
 */
const updateSite = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (location) updateFields.location = location;

    const site = await Site.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!site) {
      return res
        .status(404)
        .json({ success: false, message: 'Site not found' });
    }

    res.status(200).json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   DELETE /api/v1/admin/sites/:id
 * @desc    Delete a site
 * @access  Admin
 */
const deleteSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) {
      return res
        .status(404)
        .json({ success: false, message: 'Site not found' });
    }

    // Remove this site from all users' assignedSites arrays
    await User.updateMany(
      { assignedSites: site._id },
      { $pull: { assignedSites: site._id } }
    );
    await Sensor.deleteMany({ siteId: site._id });

    res.status(200).json({ success: true, message: 'Site deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   PUT /api/v1/admin/sites/:id/regenerate-key
 * @desc    Regenerate the API key for a site
 * @access  Admin
 */
const regenerateSiteApiKey = async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { apiKey: uuidv4() },
      { new: true }
    );

    if (!site) {
      return res
        .status(404)
        .json({ success: false, message: 'Site not found' });
    }

    res.status(200).json({ success: true, data: site });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   PUT /api/v1/admin/users/:id/assign-sites
 * @desc    Assign one or multiple sites to a user
 * @access  Admin
 */
const assignSitesToUser = async (req, res) => {
  try {
    const { siteIds } = req.body;

    if (!siteIds || !Array.isArray(siteIds)) {
      return res
        .status(400)
        .json({ success: false, message: 'siteIds must be an array' });
    }

    // Verify all site IDs exist
    const sites = await Site.find({ _id: { $in: siteIds } });
    if (sites.length !== siteIds.length) {
      return res
        .status(400)
        .json({ success: false, message: 'One or more site IDs are invalid' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedSites: siteIds },
      { new: true, runValidators: true }
    ).populate('assignedSites', 'name location');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
};
