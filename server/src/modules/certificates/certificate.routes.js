const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { certificateIdParamSchema } = require('./certificate.validation');
const certificateController = require('./certificate.controller');

const router = express.Router();

// Public -- no auth. Anyone with the certificate ID (e.g. a recruiter)
// can confirm it's real without needing an account.
router.get('/verify/:certificateId', validate(certificateIdParamSchema), certificateController.verifyCertificate);

// Requires auth -- ownership/coordinator/admin check happens inside the controller.
router.get(
  '/:certificateId/download',
  protect,
  validate(certificateIdParamSchema),
  certificateController.downloadCertificate
);

module.exports = router;
