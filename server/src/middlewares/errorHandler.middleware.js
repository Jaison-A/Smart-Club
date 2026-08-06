const env = require('../config/env');

// Translates known Mongoose/JWT error types into clean AppError-style
// responses, so controllers can just `throw` or `next(err)` without
// worrying about formatting.
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Mongoose validation errors (e.g. missing required field)
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Mongoose duplicate key error (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
  }

  // Malformed ObjectId passed in a route param
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    // Stack traces are only useful (and safe) to expose in development.
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
