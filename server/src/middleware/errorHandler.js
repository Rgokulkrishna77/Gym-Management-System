const AppError = require('../utils/AppError');

exports.notFound = (req, _res, next) =>
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Centralized error handler: turns any thrown error into a JSON response
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Translate common MySQL errors into friendly HTTP errors
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      status = 409;
      message = /email/i.test(err.sqlMessage || '') ? 'Email is already registered'
        : /plan_name/i.test(err.sqlMessage || '') ? 'A plan with this name already exists'
        : 'Duplicate value: record already exists';
      break;
    case 'ER_ROW_IS_REFERENCED_2':
      status = 409;
      message = 'This record is in use by other records and cannot be deleted';
      break;
    case 'ER_NO_REFERENCED_ROW_2':
      status = 400;
      message = 'A referenced record (member, trainer or plan) does not exist';
      break;
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      status = 400;
      message = 'A value violates a database rule (check constraint)';
      break;
    default:
  }
  // Errors raised by SIGNAL in the stored procedure
  if (err.sqlState === '45000') {
    status = /not found/i.test(err.sqlMessage || '') ? 404 : 400;
    message = err.sqlMessage;
  }

  if (status >= 500) console.error(err);
  const body = { success: false, message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message };
  if (err.details) body.errors = err.details;
  res.status(status).json(body);
};
