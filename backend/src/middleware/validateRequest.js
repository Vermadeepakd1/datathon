const { ZodError } = require("zod");
const { HttpError } = require("../utils/httpError");

const parseWithSchema = (schema, input) => schema.parse(input);

const validateRequest = (schema) => (req, _res, next) => {
  try {
    req.validated = parseWithSchema(schema, req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new HttpError(400, "Validation failed", error.issues));
    }
    return next(error);
  }
};

const validateQuery = (schema) => (req, _res, next) => {
  try {
    req.validatedQuery = parseWithSchema(schema, req.query);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new HttpError(400, "Validation failed", error.issues));
    }
    return next(error);
  }
};

const validateParams = (schema) => (req, _res, next) => {
  try {
    req.validatedParams = parseWithSchema(schema, req.params);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new HttpError(400, "Validation failed", error.issues));
    }
    return next(error);
  }
};

module.exports = { validateRequest, validateQuery, validateParams };
