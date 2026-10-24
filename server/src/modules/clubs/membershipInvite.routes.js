const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { inviteIdParamSchema } = require('./membershipInvite.validation');
const controller = require('./membershipInvite.controller');

const router = express.Router();

router.get('/mine', protect, controller.listMyInvites);
router.patch('/:inviteId/accept', protect, validate(inviteIdParamSchema), controller.acceptInvite);
router.patch('/:inviteId/reject', protect, validate(inviteIdParamSchema), controller.rejectInvite);

module.exports = router;
