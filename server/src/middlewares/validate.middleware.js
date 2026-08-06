const { ZodError } = require('zod');

// Validates req.{body,query,params} against a Zod schema shaped like
// { body: z.object({...}) }. Keeping validation as a schema object per
// route (rather than inline checks in controllers) keeps controllers
// focused on business logic only.
function validate(schema) {
  return function runValidation(req, res, next) {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors.map((e) => ({
            field: e.path.slice(1).join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
