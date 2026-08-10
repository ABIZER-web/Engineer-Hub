// backend/src/middleware/errorMiddleware.js
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message    = err.message || 'Server Error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') { statusCode = 404; message = 'Resource not found'; }
  if (err.code === 11000)           { statusCode = 400; message = 'Email already in use'; }
  if (err.name === 'ValidationError') { statusCode = 400; message = Object.values(err.errors).map(v => v.message).join(', '); }
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token expired. Please login again.'; }

  res.status(statusCode).json({
    success: false, message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
