const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Verifies the "Authorization: Bearer <token>" header and sets req.user
exports.authenticate = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

// Like authenticate, but anonymous visitors are allowed (req.user stays undefined)
exports.optionalAuth = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* ignore */ }
  }
  next();
};

// Role-based access control: authorize('admin', 'receptionist')
exports.authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to do this'));
  next();
};
