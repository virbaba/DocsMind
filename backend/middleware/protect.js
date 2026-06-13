import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes.
 * Reads the access token from HTTP-only cookie, verifies it, and attaches req.user statelessly.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      if (req.cookies?.refreshToken) {
        return res.status(401).json({ message: 'Access token missing.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (error) {
    console.error('[protect middleware]', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export default protect;
