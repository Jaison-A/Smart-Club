const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const validate = require('../../middlewares/validate.middleware');
const { success } = require('../../utils/apiResponse');
const { userIdParamSchema, setRoleSchema, listUsersQuerySchema } = require('./user.validation');
const userController = require('./user.controller');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/ping', (req, res) => {
  return success(res, 200, { adminId: req.user._id }, 'Admin access confirmed');
});

router.get('/users', validate(listUsersQuerySchema), userController.listUsers);
router.get('/users/:id', validate(userIdParamSchema), userController.getUser);
router.get('/users/:id/overview', validate(userIdParamSchema), userController.getUserOverview);
router.patch('/users/:id/role', validate(setRoleSchema), userController.setRole);
router.patch('/users/:id/disable', validate(userIdParamSchema), userController.disableUser);
router.patch('/users/:id/enable', validate(userIdParamSchema), userController.enableUser);

module.exports = router;
