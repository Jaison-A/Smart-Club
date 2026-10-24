const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(objectIdRegex, `Invalid ${label}`);

const socialLinksSchema = z
  .object({
    instagram: z.string().trim().url().optional().or(z.literal('')),
    linkedin: z.string().trim().url().optional().or(z.literal('')),
    github: z.string().trim().url().optional().or(z.literal('')),
    website: z.string().trim().url().optional().or(z.literal('')),
  })
  .optional();

const facultyAdvisorSchema = z
  .object({
    name: z.string().trim().max(100),
    email: z.string().trim().email().or(z.literal('')),
    designation: z.string().trim().max(100),
  })
  .partial();

const createClubSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().trim().max(2000).optional(),
    vision: z.string().trim().max(1000).optional(),
    mission: z.string().trim().max(1000).optional(),
    category: z.string().trim().max(50).optional(),
    logoUrl: z.string().trim().url().optional().or(z.literal('')),
    coverImageUrl: z.string().trim().url().optional().or(z.literal('')),
    tags: z.array(z.string().trim().min(1)).max(20).optional(),
    socialLinks: socialLinksSchema,
    facultyAdvisor: facultyAdvisorSchema.optional(),
  }),
});

// Everything optional on update — a coordinator might only be changing
// the description, and shouldn't be forced to resend the whole object.
const updateClubSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      description: z.string().trim().max(2000),
      vision: z.string().trim().max(1000),
      mission: z.string().trim().max(1000),
      category: z.string().trim().max(50),
      logoUrl: z.string().trim().url().or(z.literal('')),
      coverImageUrl: z.string().trim().url().or(z.literal('')),
      tags: z.array(z.string().trim().min(1)).max(20),
      socialLinks: socialLinksSchema,
      facultyAdvisor: facultyAdvisorSchema,
    })
    .partial(),
  params: z.object({
    id: objectId('club id'),
  }),
});

const clubIdParamSchema = z.object({
  params: z.object({
    id: objectId('club id'),
  }),
});

const assignCoordinatorSchema = z.object({
  body: z.object({
    userId: objectId('user id'),
  }),
  params: z.object({
    id: objectId('club id'),
  }),
});

const memberParamSchema = z.object({
  params: z.object({
    id: objectId('club id'),
    userId: objectId('user id'),
  }),
});

const listClubsQuerySchema = z.object({
  query: z.object({
    category: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    search: z.string().trim().optional(),
    status: z.enum(['pending', 'active', 'rejected', 'suspended', 'archived', 'all']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

const rejectClubSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }),
  params: z.object({
    id: objectId('club id'),
  }),
});

module.exports = {
  createClubSchema,
  updateClubSchema,
  clubIdParamSchema,
  rejectClubSchema,
  assignCoordinatorSchema,
  memberParamSchema,
  listClubsQuerySchema,
};
