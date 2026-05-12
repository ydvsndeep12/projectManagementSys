/**
 * Seed script — creates default admin accounts.
 * Run once:  node seeds/seed.js
 *
 * Existing users with the same email are skipped (not duplicated).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const admins = [
  {
    name: 'Admin User',
    email: 'admin@taskflow.com',
    password: 'Admin@123',
    role: 'admin',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const admin of admins) {
      const exists = await User.findOne({ email: admin.email });
      if (exists) {
        console.log(`[SKIP] ${admin.email} already exists`);
        continue;
      }
      await User.create(admin);
      console.log(`[CREATED] Admin → ${admin.email}  password: ${admin.password}`);
    }

    console.log('\nSeed complete.');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
