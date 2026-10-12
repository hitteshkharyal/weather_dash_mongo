/**
 * Row-Level Security middleware.
 *
 * Ensures non-admin users can only access data belonging to their assignedSites.
 * Must be used AFTER the `protect` middleware so req.user is available.
 *
 * If a `siteId` is present in req.params, req.query, or req.body, this middleware
 * verifies the user has been assigned that site. Admins bypass all checks.
 */
const enforceSiteAccess = (req, res, next) => {
  // Admins bypass row-level security
  if (req.user.role === 'admin') return next();

  // Extract siteId from multiple possible locations
  const siteId =
    req.params.siteId || req.query.siteId || req.body.siteId;

  if (!siteId) {
    // If no specific site requested, we'll filter in the controller
    // Attach the user's allowed site IDs for downstream use
    req.allowedSiteIds = req.user.assignedSites.map((s) =>
      typeof s === 'object' ? s._id.toString() : s.toString()
    );
    return next();
  }

  // Check if the requested site is in the user's assigned sites
  const assignedIds = req.user.assignedSites.map((s) =>
    typeof s === 'object' ? s._id.toString() : s.toString()
  );

  if (!assignedIds.includes(siteId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied — you are not assigned to this site',
    });
  }

  next();
};

module.exports = { enforceSiteAccess };
