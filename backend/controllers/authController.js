import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateTokens, clearTokenCookies } from '../utils/generateTokens.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Smart: creates user if not found, otherwise logs in
// ─────────────────────────────────────────────────────────────
export const loginOrRegister = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Derive a display name from the email prefix (e.g. john.doe@gmail.com → John Doe)
    const deriveName = (email) => {
      const prefix = email.split('@')[0];
      return prefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    let user = await User.findOne({ email }).select('+password');
    let isNewUser = false;

    if (!user) {
      // ── New user: create account immediately ──
      user = await User.create({
        email,
        password,
        name: deriveName(email),
      });
      isNewUser = true;
      // Re-fetch without password field limitation issue
      user = await User.findById(user._id).select('+password');
    } else {
      // ── Existing user: verify password ──
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password. Please try again.' });
      }
    }

    // Generate tokens & set cookies
    const { refreshToken } = generateTokens(res, user);

    // Persist refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateModifiedOnly: true });

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Account created and logged in.' : 'Logged in successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[loginOrRegister]', error);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Uses refresh token cookie to issue new access token
// ─────────────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Refresh token mismatch. Please log in again.' });
    }

    // Issue new pair
    const { refreshToken: newRefreshToken } = generateTokens(res, user);
    user.refreshToken = newRefreshToken;
    await user.save({ validateModifiedOnly: true });

    return res.status(200).json({ message: 'Token refreshed.' });
  } catch (error) {
    console.error('[refreshAccessToken]', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Invalidate stored refresh token in DB
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save({ validateModifiedOnly: true });
      }
    }

    clearTokenCookies(res);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[logout]', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate raw token, hash it for storage
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateModifiedOnly: true });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      // Rollback reset token if email fails
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateModifiedOnly: true });
      console.error('[forgotPassword] Email send failed:', emailError);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    return res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgotPassword]', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Hash the incoming raw token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    // Update password & clear reset fields
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null; // invalidate existing sessions
    await user.save();

    // Auto-login after reset
    const { refreshToken } = generateTokens(res, user);
    user.refreshToken = refreshToken;
    await user.save({ validateModifiedOnly: true });

    return res.status(200).json({
      message: 'Password reset successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[resetPassword]', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns current user from access token cookie
// ─────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({
      user: {
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('[getMe]', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};
