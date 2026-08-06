const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function startServer() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Catch programming errors / unhandled promise rejections that slip
  // past catchAsync, and shut down gracefully rather than leaving the
  // process in a corrupted state.
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => process.exit(1));
  });
}

startServer();
