const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (admin-only in production, open for first setup)
 * @access  Public (initial setup) or Admin
 */
const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Only admins can create admin users (if caller is authenticated)
    const assignedRole =
      req.user && req.user.role === 'admin' ? role || 'user' : 'user';

    const user = await User.create({
      email,
      password,
      name,
      role: assignedRole,
    });

    const token = generateToken(user._id);

    res.cookie('token', token, {
      ...authCookieOptions,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return JWT
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email })
      .select('+password')
      .populate('assignedSites', 'name location');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      ...authCookieOptions,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'assignedSites',
      'name location description'
    );

    res.status(200).json({
      success: true,
      data: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear auth cookie
 * @access  Public
 */
const logout = (req, res) => {
  res.clearCookie('token', authCookieOptions);
  res.status(200).json({
    success: true,
    data: {},
  });
};

module.exports = { register, login, getMe, logout };
