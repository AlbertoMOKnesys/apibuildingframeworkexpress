const { checkSchema, validationResult } = require("express-validator");

// https://express-validator.github.io/docs/api/check-schema
//Ejemplo
const userSchema = {
  name: {
    in: ["body"],
    errorMessage: "Name is wrong",
    isString: true,
  },
  age: {
    in: ["body"],
    errorMessage: "Age is wrong",
    isInt: true,
    // Puedes agregar más opciones de validación como min, max, etc.
  },
  // Añade más campos según sea necesario
};

const validateSchemaExpress = (schema) => {
  return [
    checkSchema(schema),
    // Middleware para rechazar campos adicionales
    (req, res, next) => {
      // Obtener todos los campos definidos en el esquema
      const schemaFields = Object.keys(schema);

      // Verificar si hay campos adicionales en el cuerpo de la solicitud
      const extraFields = Object.keys(req.body).filter(
        (field) => !schemaFields.includes(field)
      );

      if (extraFields.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "schema error",
          data: `Extra fields are not allowed: ${extraFields.join(", ")}`,
        });
      }

      next();
    },
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "schema error",
          data: errors.array(),
        });
      }
      next();
    },
  ];
};
exports.validateSchemaExpress = validateSchemaExpress;
