const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: statusCode >= 500 ? 'An error occurred' : err.message,
    error: err.message,
  });
};

module.exports = errorHandler;