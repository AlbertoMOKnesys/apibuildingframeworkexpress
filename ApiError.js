class ApiError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}
class ApiErrorData extends Error {
  constructor(statusCode, message, data) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
const handleError = (err, res) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Unhandled Error";
  const data = err.data || null;
  console.log(err);
  res.status(statusCode).json({
    status: "error",
    message,
    ...(data ? { data } : {}),
  });
};

exports.ApiError = ApiError;
exports.ApiErrorData = ApiErrorData;
exports.handleError = handleError;
