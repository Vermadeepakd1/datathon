const { ZodError } = require("zod");
const { HttpError } = require("../utils/httpError");

const validateRequest = (schema) => (req, _res, next) => {
  try {
    req.validated = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new HttpError(400, "Validation failed", error.issues));
    }
    return next(error);
  }
};

module.exports = { validateRequest };
