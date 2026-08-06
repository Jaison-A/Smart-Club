// Wraps an async controller so any rejected promise is forwarded to
// Express's error-handling middleware instead of crashing the process
// or requiring a try/catch block in every single controller.
function catchAsync(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = catchAsync;
