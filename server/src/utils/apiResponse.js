// A single consistent shape for every response makes the frontend's
// Axios interceptors and error handling predictable.

function success(res, statusCode, data, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function error(res, statusCode, message = 'Something went wrong', errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { success, error };
