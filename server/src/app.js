const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const clubRoutes = require('./modules/clubs/club.routes');
const driveClubRoutes = require('./modules/recruitment/driveClub.routes');
const driveRoutes = require('./modules/recruitment/drive.routes');
const applicationRoutes = require('./modules/recruitment/application.routes');
const userRoutes = require('./modules/users/user.routes');
const eventClubRoutes = require('./modules/events/eventClub.routes');
const eventRoutes = require('./modules/events/event.routes');
const certificateRoutes = require('./modules/certificates/certificate.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const { router: coordinatorRequestRoutes } = require('./modules/clubs/coordinatorRequest.routes');
const membershipInviteRoutes = require('./modules/clubs/membershipInvite.routes');

const app = express();

// --- Security & parsing middleware ---
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // required so the refresh-token cookie is sent/received
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => {
      // Helmet's default Cross-Origin-Resource-Policy is same-origin, which
      // would block the frontend (another origin) from showing these images.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);
app.use(cookieParser());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limit auth endpoints specifically — this is the route most
// attractive to brute-force/credential-stuffing attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/v1/auth', authLimiter);

// --- Health check ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: env.NODE_ENV });
});

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/clubs/:clubId/drives', driveClubRoutes);
app.use('/api/v1/clubs/:clubId/events', eventClubRoutes);
app.use('/api/v1/clubs', clubRoutes);
app.use('/api/v1/drives', driveRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/coordinator-requests', coordinatorRequestRoutes);
app.use('/api/v1/member-invites', membershipInviteRoutes);

// --- Unmatched routes ---
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// --- Centralized error handler (must be registered last) ---
app.use(errorHandler);

module.exports = app;
