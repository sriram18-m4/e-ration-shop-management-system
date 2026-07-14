const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = Boolean(err.statusCode);
  const message = isOperational ? err.message : 'Internal server error.';

  if (statusCode >= 500) {
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

