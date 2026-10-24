const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

// Access token: short-lived, sent on every request, carries identity + role.
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

// Refresh token: long-lived, used only to mint new access tokens.
// Kept minimal on purpose — it should not carry role, since role could
// change (e.g. promoted to coordinator) before the refresh token expires.
function generateRefreshToken(user) {
  // jti makes every refresh token unique. Without it, two tokens minted for the
  // same user within the same second (iat has 1s resolution) would be byte-
  // identical, so "rotating" could re-issue the very token it just revoked and
  // replay detection would silently stop working.
  return jwt.sign(
    { userId: user._id.toString(), jti: crypto.randomBytes(12).toString('hex') },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

// We never store raw refresh tokens in the DB — only a hash. If the
// database were ever leaked, the hashes alone can't be replayed as
// valid tokens.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
