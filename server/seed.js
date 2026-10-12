const User = require('./models/User');

/**
 * Seeds a default admin account on first startup if no admin exists.
 */
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return;

    const email = process.env.ADMIN_EMAIL || 'admin@weather.local';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    await User.create({
      email,
      password,
      name: 'System Admin',
      role: 'admin',
    });

    console.log(`🌱 Default admin seeded: ${email}`);
  } catch (err) {
    console.error('⚠️  Admin seed failed:', err.message);
  }
};

module.exports = seedAdmin;
