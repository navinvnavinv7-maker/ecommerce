import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log(`
Usage:
  node server/scripts/create-admin.js <username> <email> <password>

Example:
  node server/scripts/create-admin.js owner owner@gmail.com SuperSecure123
`);
    process.exit(1);
  }

  const [username, email, password] = args;
  const normalizedEmail = email.toLowerCase().trim();

  // Validate email in ADMIN_EMAILS list
  if (!ADMIN_EMAILS.includes(normalizedEmail)) {
    console.error(`❌ Error: Email "${normalizedEmail}" is not listed in ADMIN_EMAILS in your .env file.`);
    console.error(`Please update ADMIN_EMAILS inside .env to include this email first.`);
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters.');
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      console.log(`User with email "${normalizedEmail}" already exists. Upgrading to admin and updating password...`);
      user.role = 'admin';
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
      console.log('🎉 Admin account updated and verified successfully!');
    } else {
      console.log(`Creating new admin account for "${normalizedEmail}"...`);
      const newAdmin = new User({
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      await newAdmin.save();
      console.log('🎉 Admin account created and verified successfully!');
    }

  } catch (err) {
    console.error('❌ Error executing script:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

run();
