// Error with an HTTP status code; handled by middleware/errorHandler.js
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = AppError;
