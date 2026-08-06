const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

// Demo endpoint: only reachable by admins. Used in the testing steps
// below to prove that protect + authorize are wired correctly.
router.get('/ping', protect, authorize('admin'), (req, res) => {
  return success(res, 200, { adminId: req.user._id }, 'Admin access confirmed');
});

module.exports = router;
