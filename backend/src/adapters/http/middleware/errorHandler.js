const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Malformed ids and schema validation failures are client errors
  if (err.name === "CastError") { status = 400; message = "Invalid id"; }
  if (err.name === "ValidationError") { status = 400; }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
