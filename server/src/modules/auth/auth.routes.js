const express = require('express');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { uploadAvatar } = require('../../config/upload');
const AppError = require('../../utils/AppError');
const { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } = require('./auth.validation');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, validate(updateProfileSchema), authController.updateProfile);
router.patch('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

// protect first so req.user exists for multer's filename callback. Multer's
// own errors (bad type / too large) are normalised into the API's AppError.
router.post(
  '/me/avatar',
  protect,
  (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
      if (err) return next(new AppError(err.message || 'Could not upload image', 400));
      next();
    });
  },
  authController.uploadAvatar
);

module.exports = router;
