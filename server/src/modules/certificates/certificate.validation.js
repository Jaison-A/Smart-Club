const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const eventIdParamSchema = z.object({
  params: z.object({ eventId: objectId('event id') }),
});

const generateForAttendeeSchema = z.object({
  params: z.object({ eventId: objectId('event id'), userId: objectId('user id') }),
});

const certificateIdParamSchema = z.object({
  params: z.object({ certificateId: z.string().trim().min(1) }),
});

const userIdParamSchema = z.object({
  params: z.object({ id: objectId('user id') }),
});

module.exports = {
  eventIdParamSchema,
  generateForAttendeeSchema,
  certificateIdParamSchema,
  userIdParamSchema,
};
