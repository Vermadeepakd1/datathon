const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || "Internal server error",
  };

  if (error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
