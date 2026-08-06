const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const submitApplicationSchema = z.object({
  body: z.object({
    responses: z
      .array(
        z.object({
          field: z.string().trim().min(1),
          value: z.string().trim().max(2000),
        })
      )
      .max(30)
      .default([]),
    resumeUrl: z.string().trim().url().optional().or(z.literal('')),
  }),
  params: z.object({
    driveId: objectId('drive id'),
  }),
});

const applicationIdParamSchema = z.object({
  params: z.object({
    id: objectId('application id'),
  }),
});

const updateApplicationStatusSchema = z.object({
  body: z.object({
    // 'submitted' excluded on purpose — that's only ever the initial
    // state, never something a coordinator sets it back to.
    status: z.enum(['shortlisted', 'interview', 'accepted', 'rejected']),
    reviewNotes: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    id: objectId('application id'),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({
    id: objectId('user id'),
  }),
});

module.exports = {
  submitApplicationSchema,
  applicationIdParamSchema,
  updateApplicationStatusSchema,
  userIdParamSchema,
};
