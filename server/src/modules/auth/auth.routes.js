const express = require('express');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { registerSchema, loginSchema, changePasswordSchema } = require('./auth.validation');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
