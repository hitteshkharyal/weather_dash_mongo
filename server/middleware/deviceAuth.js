const Site = require('../models/Site');

/**
 * Device authentication middleware.
 * Validates the X-Device-API-Key header against Site.apiKey.
 * Attaches req.site on success.
 */
const deviceAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-device-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Missing X-Device-API-Key header',
      });
    }

    const site = await Site.findOne({ apiKey });

    if (!site) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device API key',
      });
    }

    req.site = site;
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Device authentication error',
    });
  }
};

module.exports = { deviceAuth };
