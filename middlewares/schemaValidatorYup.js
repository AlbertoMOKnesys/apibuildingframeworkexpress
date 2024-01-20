const yup = require("yup");

const validateSchemaYup = (schema) => async (req, res, next) => {
  try {
    // Validate the request body against the schema
    const validatedBody = await schema.validate(req.body, {
      abortEarly: false,
    });
    req.body = validatedBody;
    return next();
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "schema error",
      data: error.errors,
    });
    // If validation fails, send a 400 Bad Request response
    // res.status(400).json({ errors: error.errors });
  }
};

exports.validateSchemaYup = validateSchemaYup;
