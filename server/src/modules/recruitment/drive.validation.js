const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const formFieldSchema = z.object({
  label: z.string().trim().min(1, 'Field label is required').max(150),
  type: z.enum(['text', 'textarea', 'number', 'select', 'url']).default('text'),
  required: z.boolean().default(true),
  options: z.array(z.string().trim().min(1)).max(20).optional(),
});

const createDriveSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
      description: z.string().trim().max(3000).optional(),
      formFields: z.array(formFieldSchema).max(30).default([]),
      openDate: z.coerce.date(),
      closeDate: z.coerce.date(),
    })
    .refine((data) => data.closeDate > data.openDate, {
      message: 'closeDate must be after openDate',
      path: ['closeDate'],
    }),
  params: z.object({
    clubId: objectId('club id'),
  }),
});

const updateDriveSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(150),
      description: z.string().trim().max(3000),
      formFields: z.array(formFieldSchema).max(30),
      openDate: z.coerce.date(),
      closeDate: z.coerce.date(),
      status: z.enum(['upcoming', 'open', 'closed']),
    })
    .partial(),
  params: z.object({
    driveId: objectId('drive id'),
  }),
});

const driveIdParamSchema = z.object({
  params: z.object({
    driveId: objectId('drive id'),
  }),
});

const listDrivesQuerySchema = z.object({
  params: z.object({
    clubId: objectId('club id'),
  }),
  query: z.object({
    status: z.enum(['upcoming', 'open', 'closed']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

const listApplicationsForDriveQuerySchema = z.object({
  params: z.object({
    driveId: objectId('drive id'),
  }),
  query: z.object({
    status: z.enum(['submitted', 'shortlisted', 'interview', 'accepted', 'rejected']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

module.exports = {
  createDriveSchema,
  updateDriveSchema,
  driveIdParamSchema,
  listDrivesQuerySchema,
  listApplicationsForDriveQuerySchema,
};
