const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const createEventSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(150),
      description: z.string().trim().max(3000).optional(),
      venue: z.string().trim().max(200).optional(),
      bannerUrl: z.string().trim().url().optional().or(z.literal('')),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      registrationRequired: z.boolean().optional().default(true),
      capacity: z.number().int().min(0).optional().default(0),
    })
    .refine((data) => data.endTime > data.startTime, {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }),
  params: z.object({ clubId: objectId('club id') }),
});

const updateEventSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(150),
      description: z.string().trim().max(3000),
      venue: z.string().trim().max(200),
      bannerUrl: z.string().trim().url().or(z.literal('')),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      registrationRequired: z.boolean(),
      capacity: z.number().int().min(0),
      status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']),
    })
    .partial(),
  params: z.object({ eventId: objectId('event id') }),
});

const eventIdParamSchema = z.object({
  params: z.object({ eventId: objectId('event id') }),
});

const listEventsQuerySchema = z.object({
  params: z.object({ clubId: objectId('club id') }),
  query: z.object({
    status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

const markAttendanceSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Attendance code is required'),
  }),
  params: z.object({ eventId: objectId('event id') }),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema,
  listEventsQuerySchema,
  markAttendanceSchema,
};
