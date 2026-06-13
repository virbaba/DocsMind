import jwt from 'jsonwebtoken';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

/**
 * Generate access + refresh tokens and set them as HTTP-only cookies.
 * Returns both tokens for any additional use (e.g. storing refreshToken in DB).
 */
export const generateTokens = (res, user) => {
  // Access token — short lived, contains name and email for stateless reads
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    }
  );

  // Refresh token — long lived
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
};

/**
 * Clear auth cookies.
 */
export const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
