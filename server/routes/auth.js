import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { users as memoryUsers } from '../models/memoryDB.js'; // Keep fallback memory source
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { 
  sendVerificationEmail, 
  sendForgotPasswordEmail 
} from '../utils/emailHelper.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'navin_ecommerce_secret_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'navin_ecommerce_refresh_secret_2026';

const isDbConnected = () => mongoose.connection.readyState === 1;

const resolveUserRole = (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(normalizedEmail) ? 'admin' : 'customer';
};

// Simulated Memory tokens storage for fallback mode
const memoryRefreshTokens = []; 
const memoryVerificationFields = {}; // email -> { otp, otpExpires, verificationToken, verificationTokenExpires }
const memoryResetPasswordFields = {}; // email -> { resetPasswordToken, resetPasswordExpires }

// Helper to hash tokens
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Helpers to generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id.toString(), username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// 1. REGISTER ENDPOINT
router.post('/register', registerValidator, async (req, res) => {
  const { username, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.trim();

  // Generate OTP (6-digit) and Verification Token
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Host URL for direct link verification
  const protocol = req.protocol;
  const host = req.get('host');
  const verificationLink = `${protocol}://${host}/api/auth/verify-email?token=${verificationToken}`;

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
        role: 'customer',
        isVerified: false,
        verificationToken,
        verificationTokenExpires,
        otp,
        otpExpires
      });

      await newUser.save();

      // Send Verification Email
      await sendVerificationEmail(normalizedEmail, otp, verificationLink);

      return res.status(201).json({
        success: true,
        message: "Registration completed successfully! Please verify your email with the OTP or verification link sent to you.",
        email: normalizedEmail
      });
    }
  } catch (err) {
    console.error('MongoDB User registration error:', err.message);
  }

  // Fallback to memory DB
  const alreadyRegistered = memoryUsers.find(
    u => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === normalizedUsername.toLowerCase()
  );
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
    role: 'customer',
    isVerified: false
  };

  memoryUsers.push(newUser);
  memoryVerificationFields[normalizedEmail] = {
    otp,
    otpExpires,
    verificationToken,
    verificationTokenExpires
  };

  // Send Verification Email
  await sendVerificationEmail(normalizedEmail, otp, verificationLink);

  res.status(201).json({
    success: true,
    message: "Registration completed successfully on memory fallback! Verify your email using the OTP or verification link sent to you.",
    email: normalizedEmail
  });
});

// 2. EMAIL VERIFICATION (LINK CALLBACK)
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('<h1>Verification token is missing.</h1>');
  }

  try {
    if (isDbConnected()) {
      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).send('<h1>Invalid or expired verification link.</h1>');
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.otp = undefined;
      user.otpExpires = undefined;
      user.role = resolveUserRole(user.email);
      await user.save();

      return res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
          <h1 style="color: #10b981;">Email Verified Successfully!</h1>
          <p>You can now return to the Nexus Couture storefront and log in.</p>
          <a href="/" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;">Return to Shop</a>
        </div>
      `);
    }
  } catch (err) {
    console.error('MongoDB email verification error:', err.message);
  }

  // Memory fallback
  let verified = false;
  for (const email of Object.keys(memoryVerificationFields)) {
    const data = memoryVerificationFields[email];
    if (data.verificationToken === token && new Date() < data.verificationTokenExpires) {
      const user = memoryUsers.find(u => u.email.toLowerCase() === email);
      if (user) {
        user.isVerified = true;
        verified = true;
        delete memoryVerificationFields[email];
        break;
      }
    }
  }

  if (verified) {
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
        <h1 style="color: #10b981;">Email Verified Successfully (Memory Mode)!</h1>
        <p>You can now return to the Nexus Couture storefront and log in.</p>
        <a href="/" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;">Return to Shop</a>
      </div>
    `);
  }

  res.status(400).send('<h1>Invalid or expired verification link (Memory Mode).</h1>');
});

// 3. OTP VERIFICATION (MODAL CODE INPUT)
router.post('/otp-verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP code are required fields." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      const user = await User.findOne({
        email: normalizedEmail,
        otp: otp.trim(),
        otpExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired OTP code. Please request a new one." });
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.otp = undefined;
      user.otpExpires = undefined;
      user.role = resolveUserRole(user.email);
      await user.save();

      // Automatically generate login tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const tokenHash = hashToken(refreshToken);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const newRefreshToken = new RefreshToken({
        user: user._id,
        tokenHash,
        device: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
        expiresAt
      });
      await newRefreshToken.save();

      // Set cookie
      res.cookie('nexus_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        message: "Email verified successfully! Session authorized.",
        token: accessToken,
        user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
      });
    }
  } catch (err) {
    console.error('MongoDB OTP verification error:', err.message);
  }

  // Memory fallback
  const memData = memoryVerificationFields[normalizedEmail];
  if (memData && memData.otp === otp.trim() && new Date() < memData.otpExpires) {
    const user = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      user.isVerified = true;
      user.role = resolveUserRole(user.email);
      delete memoryVerificationFields[normalizedEmail];

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      
      memoryRefreshTokens.push({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false
      });

      // Set cookie
      res.cookie('nexus_refresh_token', refreshToken, {
        httpOnly: true,
        secure: false, // Local Dev memory mode
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        message: "Email verified successfully (Memory mode)! Session authorized.",
        token: accessToken,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    }
  }

  res.status(400).json({ error: "Invalid or expired OTP code." });
});

// 4. RESEND VERIFICATION
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const protocol = req.protocol;
  const host = req.get('host');
  const verificationLink = `${protocol}://${host}/api/auth/verify-email?token=${verificationToken}`;

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }
      if (user.isVerified) {
        return res.status(400).json({ error: "This email address is already verified." });
      }

      user.otp = otp;
      user.otpExpires = otpExpires;
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = verificationTokenExpires;
      await user.save();

      await sendVerificationEmail(normalizedEmail, otp, verificationLink);

      return res.json({ success: true, message: "A new verification code has been dispatched." });
    }
  } catch (err) {
    console.error('MongoDB resend verification error:', err.message);
  }

  // Memory fallback
  const user = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  if (user.isVerified) {
    return res.status(400).json({ error: "This email address is already verified." });
  }

  memoryVerificationFields[normalizedEmail] = {
    otp,
    otpExpires,
    verificationToken,
    verificationTokenExpires
  };

  await sendVerificationEmail(normalizedEmail, otp, verificationLink);
  res.json({ success: true, message: "A new verification code has been dispatched (Memory mode)." });
});

// 5. USER LOGIN
router.post('/login', loginValidator, async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or credentials." });
      }

      const resolvedRole = resolveUserRole(user.email);
      if (user.role !== resolvedRole) {
        user.role = resolvedRole;
        await user.save();
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or credentials." });
      }

      // STRICT CHECK: Account must be verified
      if (!user.isVerified) {
        return res.status(403).json({
          error: "UnverifiedEmail",
          message: "Please verify your email address to log in.",
          email: user.email
        });
      }

      // Generate Access & Refresh tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const tokenHash = hashToken(refreshToken);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newRefreshToken = new RefreshToken({
        user: user._id,
        tokenHash,
        device: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
        expiresAt
      });
      await newRefreshToken.save();

      // Set HTTP-only Cookie
      res.cookie('nexus_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json({
        success: true,
        message: `Authenticated as ${user.username}!`,
        token: accessToken,
        user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
      });
    }
  } catch (err) {
    console.error('MongoDB Login authentication error:', err.message);
  }

  // Fallback to memory
  const user = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (user) {
    user.role = resolveUserRole(user.email);

    // Password checking support for simulated bcrypt or direct text comparison
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (_) {
      isMatch = false;
    }
    if (!isMatch && user.password === password) {
      isMatch = true;
    }
    if (user.password === '$2a$10$324sd8fsfsf' && password === 'admin') {
      isMatch = true;
    }
    if (user.password === '$2a$10$324sd8fsfsg' && password === 'customer') {
      isMatch = true;
    }

    if (isMatch) {
      // Memory mock profiles bypass verification check for admin/customer simulation profiles
      if (!user.isVerified && user.username !== 'admin' && user.username !== 'customer') {
        return res.status(403).json({
          error: "UnverifiedEmail",
          message: "Please verify your email address to log in.",
          email: user.email
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();

      memoryRefreshTokens.push({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false
      });

      // Set cookie
      res.cookie('nexus_refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: `Authenticated as ${user.username} (Fallback Memory)!`,
        token: accessToken,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    }
  }

  res.status(401).json({ error: "Invalid email or credentials." });
});

// 6. REFRESH TOKEN ENDPOINT
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.nexus_refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided." });
  }

  const tokenHash = hashToken(refreshToken);

  try {
    if (isDbConnected()) {
      const storedToken = await RefreshToken.findOne({ tokenHash, revoked: false });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        if (storedToken) {
          storedToken.revoked = true;
          await storedToken.save();
        }
        res.clearCookie('nexus_refresh_token');
        return res.status(403).json({ error: "Invalid or expired refresh token." });
      }

      const user = await User.findById(storedToken.user);
      if (!user) {
        res.clearCookie('nexus_refresh_token');
        return res.status(403).json({ error: "User account not located." });
      }

      // Rotate Token: Revoke old token and issue new token pair
      storedToken.revoked = true;
      await storedToken.save();

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken();
      const newHash = hashToken(newRefreshToken);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const refreshedTokenDoc = new RefreshToken({
        user: user._id,
        tokenHash: newHash,
        device: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
        expiresAt
      });
      await refreshedTokenDoc.save();

      res.cookie('nexus_refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        token: newAccessToken
      });
    }
  } catch (err) {
    console.error('Refresh token error:', err.message);
  }

  // Memory fallback
  const storedIndex = memoryRefreshTokens.findIndex(rt => rt.token === refreshToken && !rt.revoked);
  if (storedIndex !== -1) {
    const stored = memoryRefreshTokens[storedIndex];
    if (stored.expiresAt > new Date()) {
      stored.revoked = true;

      const user = memoryUsers.find(u => u._id === stored.userId);
      if (user) {
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken();

        memoryRefreshTokens.push({
          userId: user._id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: false
        });

        res.cookie('nexus_refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
          success: true,
          token: newAccessToken
        });
      }
    }
  }

  res.clearCookie('nexus_refresh_token');
  res.status(403).json({ error: "Invalid or expired refresh token." });
});

// 7. USER LOGOUT
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.nexus_refresh_token;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    try {
      if (isDbConnected()) {
        await RefreshToken.findOneAndUpdate({ tokenHash }, { $set: { revoked: true } });
      }
    } catch (err) {
      console.error('Logout db error:', err.message);
    }

    // Clear from memory list
    const index = memoryRefreshTokens.findIndex(rt => rt.token === refreshToken);
    if (index !== -1) {
      memoryRefreshTokens[index].revoked = true;
    }
  }

  res.clearCookie('nexus_refresh_token');
  res.json({ success: true, message: "Logged out successfully." });
});

// 8. FORGOT PASSWORD
router.post('/forgot-password', forgotPasswordValidator, async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const protocol = req.protocol;
  const host = req.get('host');
  const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Return 200/success anyway to avoid user enumeration
        return res.json({
          success: true,
          message: "If that email address is registered, a password reset link has been sent."
        });
      }

      user.resetPasswordToken = token;
      user.resetPasswordExpires = expires;
      await user.save();

      await sendForgotPasswordEmail(normalizedEmail, resetLink);

      return res.json({
        success: true,
        message: "If that email address is registered, a password reset link has been sent."
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
  }

  // Memory fallback
  const user = memoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (user) {
    memoryResetPasswordFields[normalizedEmail] = {
      resetPasswordToken: token,
      resetPasswordExpires: expires
    };
    await sendForgotPasswordEmail(normalizedEmail, resetLink);
  }

  res.json({
    success: true,
    message: "If that email address is registered, a password reset link has been sent (Memory mode)."
  });
});

// 9. RESET PASSWORD
router.post('/reset-password', resetPasswordValidator, async (req, res) => {
  const { token, password } = req.body;

  try {
    if (isDbConnected()) {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired password reset token." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.json({ success: true, message: "Password updated successfully. You can now log in." });
    }
  } catch (err) {
    console.error('Reset password error:', err.message);
  }

  // Memory fallback
  let verified = false;
  for (const email of Object.keys(memoryResetPasswordFields)) {
    const data = memoryResetPasswordFields[email];
    if (data.resetPasswordToken === token && new Date() < data.resetPasswordExpires) {
      const user = memoryUsers.find(u => u.email.toLowerCase() === email);
      if (user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        user.password = hashedPassword;
        verified = true;
        delete memoryResetPasswordFields[email];
        break;
      }
    }
  }

  if (verified) {
    return res.json({ success: true, message: "Password updated successfully in memory. You can now log in." });
  }

  res.status(400).json({ error: "Invalid or expired password reset token." });
});

// 10. GOOGLE OAUTH LOGIN
router.post('/google-login', async (req, res) => {
  const { credential, email, name, googleId } = req.body;

  let finalEmail = email;
  let finalName = name;
  let finalGoogleId = googleId;

  // Real verification logic here if credentials and GOOGLE_CLIENT_ID is present,
  // else handle standard mock verification for developers in test mode
  if (credential && process.env.GOOGLE_CLIENT_ID) {
    try {
      // In production, we would use google-auth-library.
      // To keep it lightweight and zero-dependency, we fetch google token info directly:
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      const payload = await response.json();
      if (payload.email && payload.aud === process.env.GOOGLE_CLIENT_ID) {
        finalEmail = payload.email;
        finalName = payload.name || payload.given_name;
        finalGoogleId = payload.sub;
      } else {
        return res.status(400).json({ error: "Google verification failed." });
      }
    } catch (e) {
      return res.status(400).json({ error: "Google verification connection error." });
    }
  }

  if (!finalEmail || !finalGoogleId) {
    return res.status(400).json({ error: "OAuth email and identifier must be present." });
  }

  const normalizedEmail = finalEmail.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      let user = await User.findOne({ $or: [{ googleId: finalGoogleId }, { email: normalizedEmail }] });

      if (!user) {
        user = new User({
          username: finalName.replace(/\s+/g, '_').toLowerCase() + '_' + Math.floor(1000 + Math.random() * 9000),
          email: normalizedEmail,
          googleId: finalGoogleId,
          role: 'customer',
          isVerified: true // OAuth implies email is pre-verified
        });
        await user.save();
      } else {
        // Map identifier if user registered via email first
        if (!user.googleId) {
          user.googleId = finalGoogleId;
          user.isVerified = true;
          await user.save();
        }
      }

      const resolvedRole = resolveUserRole(user.email);
      if (user.role !== resolvedRole) {
        user.role = resolvedRole;
        await user.save();
      }

      // Generate Tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const tokenHash = hashToken(refreshToken);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newRefreshToken = new RefreshToken({
        user: user._id,
        tokenHash,
        device: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || 'Unknown IP',
        expiresAt
      });
      await newRefreshToken.save();

      res.cookie('nexus_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: `OAuth session authenticated as ${user.username}`,
        token: accessToken,
        user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
      });
    }
  } catch (err) {
    console.error('Google login error:', err.message);
  }

  // Memory fallback
  let user = memoryUsers.find(u => u.googleId === finalGoogleId || u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    user = {
      _id: "u_" + Date.now(),
      username: finalName.replace(/\s+/g, '_').toLowerCase() + '_' + Math.floor(1000 + Math.random() * 9000),
      email: normalizedEmail,
      googleId: finalGoogleId,
      role: 'customer',
      isVerified: true
    };
    memoryUsers.push(user);
  } else {
    user.googleId = finalGoogleId;
    user.isVerified = true;
  }
  user.role = resolveUserRole(user.email);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  memoryRefreshTokens.push({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false
  });

  res.cookie('nexus_refresh_token', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    message: `OAuth session authenticated as ${user.username} (Memory Fallback)`,
    token: accessToken,
    user: { id: user._id, username: user.username, email: user.email, role: user.role }
  });
});

// 11. GITHUB OAUTH LOGIN
router.post('/github-login', async (req, res) => {
  const { code, email, name, githubId } = req.body;

  let finalEmail = email;
  let finalName = name;
  let finalGithubId = githubId;

  if (code && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    try {
      // Exchange code for token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });
      const tokenData = await tokenRes.json();
      
      if (tokenData.access_token) {
        // Fetch user info
        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${tokenData.access_token}`
          }
        });
        const userData = await userRes.json();

        // Fetch user emails
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${tokenData.access_token}`
          }
        });
        const emailsData = await emailRes.json();
        const primaryEmail = emailsData.find(e => e.primary)?.email || emailsData[0]?.email;

        finalEmail = primaryEmail;
        finalName = userData.name || userData.login;
        finalGithubId = userData.id.toString();
      } else {
        return res.status(400).json({ error: "GitHub verification failed." });
      }
    } catch (e) {
      return res.status(400).json({ error: "GitHub verification connection error." });
    }
  }

  if (!finalEmail || !finalGithubId) {
    return res.status(400).json({ error: "OAuth email and identifier must be present." });
  }

  const normalizedEmail = finalEmail.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      let user = await User.findOne({ $or: [{ githubId: finalGithubId }, { email: normalizedEmail }] });

      if (!user) {
        user = new User({
          username: finalName.replace(/\s+/g, '_').toLowerCase() + '_' + Math.floor(1000 + Math.random() * 9000),
          email: normalizedEmail,
          githubId: finalGithubId,
          role: 'customer',
          isVerified: true
        });
        await user.save();
      } else {
        if (!user.githubId) {
          user.githubId = finalGithubId;
          user.isVerified = true;
          await user.save();
        }
      }

      const resolvedRole = resolveUserRole(user.email);
      if (user.role !== resolvedRole) {
        user.role = resolvedRole;
        await user.save();
      }

      // Generate Tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const tokenHash = hashToken(refreshToken);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newRefreshToken = new RefreshToken({
        user: user._id,
        tokenHash,
        device: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || 'Unknown IP',
        expiresAt
      });
      await newRefreshToken.save();

      res.cookie('nexus_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: `OAuth session authenticated as ${user.username}`,
        token: accessToken,
        user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role }
      });
    }
  } catch (err) {
    console.error('GitHub login error:', err.message);
  }

  // Memory fallback
  let user = memoryUsers.find(u => u.githubId === finalGithubId || u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    user = {
      _id: "u_" + Date.now(),
      username: finalName.replace(/\s+/g, '_').toLowerCase() + '_' + Math.floor(1000 + Math.random() * 9000),
      email: normalizedEmail,
      githubId: finalGithubId,
      role: 'customer',
      isVerified: true
    };
    memoryUsers.push(user);
  } else {
    user.githubId = finalGithubId;
    user.isVerified = true;
  }
  user.role = resolveUserRole(user.email);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  memoryRefreshTokens.push({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false
  });

  res.cookie('nexus_refresh_token', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    message: `OAuth session authenticated as ${user.username} (Memory Fallback)`,
    token: accessToken,
    user: { id: user._id, username: user.username, email: user.email, role: user.role }
  });
});

export default router;
