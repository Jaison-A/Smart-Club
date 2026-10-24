const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const inviteCoordinatorSchema = z.object({
  body: z.object({
    userId: objectId('user id'),
    message: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: objectId('club id') }),
});

const clubIdParamSchema = z.object({
  params: z.object({ id: objectId('club id') }),
});

const requestIdParamSchema = z.object({
  params: z.object({ requestId: objectId('request id') }),
});

module.exports = { inviteCoordinatorSchema, clubIdParamSchema, requestIdParamSchema };
