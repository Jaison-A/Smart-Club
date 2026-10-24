const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    studentId: z.string().trim().optional(),
    department: z.string().trim().optional(),
    year: z.number().int().min(1).max(6).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    // Email OR register number (studentId) -- the login form accepts either.
    email: z.string().trim().min(1, 'Email or register number is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      department: z.string().trim().max(100),
      year: z.number().int().min(1).max(6),
      skills: z.array(z.string().trim().min(1)).max(30),
      interests: z.array(z.string().trim().min(1)).max(30),
      bio: z.string().trim().max(500),
      github: z.string().trim().url().or(z.literal('')),
      linkedin: z.string().trim().url().or(z.literal('')),
      website: z.string().trim().url().or(z.literal('')),
      resumeUrl: z.string().trim().url().or(z.literal('')),
    })
    .partial(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
};
