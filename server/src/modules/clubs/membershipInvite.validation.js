const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const inviteMemberSchema = z.object({
  body: z.object({
    userId: objectId('user id'),
    officerTitle: z.string().trim().max(60).optional(),
  }),
  params: z.object({ id: objectId('club id') }),
});

const inviteIdParamSchema = z.object({
  params: z.object({ inviteId: objectId('invite id') }),
});

const setOfficerTitleSchema = z.object({
  body: z.object({
    officerTitle: z.string().trim().max(60),
  }),
  params: z.object({ id: objectId('club id'), userId: objectId('user id') }),
});

module.exports = { inviteMemberSchema, inviteIdParamSchema, setOfficerTitleSchema };
