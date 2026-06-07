import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { users as memoryUsers } from '../models/memoryDB.js';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'navin_ecommerce_secret_2026';

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to create true signed JWTs
const createJwtToken = (id, username, email, role) => {
  return jwt.sign({ id, username, email, role }, JWT_SECRET, { expiresIn: '7d' });
};

// USER REGISTRATION
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required fields." });
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.trim();

  try {
    if (isDbConnected()) {
      const alreadyRegistered = await User.findOne({
        $or: [
          { email: normalizedEmail },
          { username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } }
        ]
      });

      if (alreadyRegistered) {
        return res.status(400).json({ error: "A user with that email or username already exists." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: "customer"
      });

      await newUser.save();

      const token = createJwtToken(newUser._id.toString(), newUser.username, newUser.email, newUser.role);
      return res.status(201).json({
        success: true,
        message: "Registration completed successfully on MongoDB!",
        token,
        user: { id: newUser._id.toString(), username: newUser.username, email: newUser.email, role: newUser.role }
      });
    }
  } catch (err) {
    console.error('MongoDB User registration error:', err.message);
  }

  // Fallback to memory
  const alreadyRegistered = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === normalizedUsername.toLowerCase());
  if (alreadyRegistered) {
    return res.status(400).json({ error: "A user with that email or username already exists." });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    _id: "u_" + Date.now(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword, 
    role: "customer"
  };
  memoryUsers.push(newUser);

  const token = createJwtToken(newUser._id, newUser.username, newUser.email, newUser.role);
  res.status(201).json({
    success: true,
    message: "Registration completed successfully on memory fallback!",
    token,
    user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
  });
});

// USER LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      let user = await User.findOne({ email: normalizedEmail });

      // Demo fallback handles automatic validation for mock flows
      if (!user && normalizedEmail === 'admin@nexus.io' && password === 'admin') {
        user = await User.findOne({ role: 'admin' });
        // Create it on the fly if it doesn't exist
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin', salt);
          user = new User({
            username: 'admin',
            email: 'admin@nexus.io',
            password: hashedPassword,
            role: 'admin'
          });
          await user.save();
        }
      } else if (!user && normalizedEmail === 'customer@nexus.io' && password === 'customer') {
        user = await User.findOne({ role: 'customer' });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('customer', salt);
          user = new User({
            username: 'customer',
            email: 'customer@nexus.io',
            password: hashedPassword,
            role: 'customer'
          });
          await user.save();
        }
      }

      if (user) {
        let isMatch = false;
        try {
          isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
          isMatch = false;
        }

        if (isMatch) {
          const token = createJwtToken(user._id.toString(), user.username, user.email, user.role);
          return res.json({
            success: true,
            message: `Authenticated as ${user.username} on MongoDB!`,
            token,
            user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
          });
        }
      }
    }
  } catch (err) {
    console.error('MongoDB Login authentication error:', err.message);
  }

  // Fallback to memory
  let user = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user && normalizedEmail === 'admin@nexus.io' && password === 'admin') {
    user = memoryUsers.find(u => u.role === 'admin');
  } else if (!user && normalizedEmail === 'customer@nexus.io' && password === 'customer') {
    user = memoryUsers.find(u => u.role === 'customer');
  }

  if (user) {
    let isMatch = false;
    if (normalizedEmail === 'admin@nexus.io' && password === 'admin' && user.role === 'admin') {
      isMatch = true;
    } else if (normalizedEmail === 'customer@nexus.io' && password === 'customer' && user.role === 'customer') {
      isMatch = true;
    } else {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (e) {
        isMatch = false;
      }
      if (!isMatch && user.password === password) {
        isMatch = true;
      }
    }

    if (isMatch) {
      const token = createJwtToken(user._id, user.username, user.email, user.role);
      return res.json({
        success: true,
        message: `Authenticated as ${user.username} (Fallback Memory)!`,
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    }
  }

  res.status(401).json({ error: "Invalid email or matching password credentials." });
});

export default router;
