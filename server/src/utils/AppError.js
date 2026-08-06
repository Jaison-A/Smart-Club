// Distinguishes "operational" errors we throw on purpose (bad input,
// unauthorized, not found) from programming bugs — the error handler
// uses this flag to decide whether to expose the message to the client.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
