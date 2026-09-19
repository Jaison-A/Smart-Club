const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const userIdParamSchema = z.object({
  params: z.object({ id: objectId('user id') }),
});

const setRoleSchema = z.object({
  body: z.object({
    role: z.enum(['student', 'coordinator', 'admin']),
  }),
  params: z.object({ id: objectId('user id') }),
});

const listUsersQuerySchema = z.object({
  query: z.object({
    role: z.enum(['student', 'coordinator', 'admin']).optional(),
    search: z.string().trim().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

module.exports = { userIdParamSchema, setRoleSchema, listUsersQuerySchema };
