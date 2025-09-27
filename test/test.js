// test.js
const yup = require("yup");
const axios = require("axios");
const express = require("express");
const { ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const MongoWraper = require("mongoclienteasywrapper")(
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.0"
);
const apiFramework = require("../index")(MongoWraper);

const app = express();
const port = 3001;

app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));

// app.get(
//   "/",
//   apiFramework.listFilter2({
//     Database: "Demek930165",
//     Collection: "testschema",
//   })
// );

//express validator
// const userSchemaExpress = {
//   name: {
//     isString: true,
//     notEmpty: true,
//     errorMessage: "Name must be a string",
//   },
//   apellido: {
//     isString: true,
//     notEmpty: true,
//     errorMessage: "Name must be a string",
//   },
//   age: {
//     isInt: true,
//     optional: { options: { nullable: true } },
//     errorMessage: "Age must be a number",
//   },
// };

// const userSchemaYup = yup
//   .object({
//     name: yup.string().required(),
//     age: yup.number().positive().integer().required(),
//     email: yup.string().email().required(),
//   })
//   .noUnknown(true, "No extra fields allowed")
//   .required()
//   .strict();

// app.post(
//   "/",
//   apiFramework.Middlewares.validateSchemaYup(userSchemaYup),
//   (req, res, next) => {
//     req.body.apellido = "tello";
//     req.body.fullname = req.body.name + req.body.apellido;
//     next();
//   },
//   apiFramework.create({
//     Database: "test",
//     Collection: "testschema",
//   })
// );

//Remove Test
// app.delete(
//   "/:_id/delete",
//   apiFramework.remove({
//     Database: "Demek930165",
//     Collection: "ty",
//   })
// );

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);

  // Espera un poco para asegurar que el servidor esté listo (opcional)
  await new Promise((res) => setTimeout(res, 500));

  // Ejecuta la prueba
  await testListfilter();
});

// const testListfilter = async () => {
//   try {
//     console.log("test");

//     const responseGet = await axios.get(`http://localhost:3001`);
//     console.log("responseGet", responseGet);
//   } catch (error) {
//     console.error("Raw error:", error);

//     // if (error.isAxiosError) {
//     //   const parsedError = {
//     //     message: error.message,
//     //     code: error.code,
//     //     address: error.address,
//     //     port: error.port,
//     //     ...(isAxios &&
//     //       error?.config && {
//     //         url: error.config.url ?? null,
//     //         method: error.config.method ?? null,
//     //         headers: error.config.headers ?? null,
//     //       }),
//     //   };

//     //   console.error("Parsed Axios Error:", parsedError);

//     //   // Puedes lanzar un error personalizado o devolver un objeto
//     //   throw Object.assign(new Error(parsedError.message), parsedError);
//     // } else {
//     //   // Otros errores no relacionados con Axios
//     //   throw error;
//     // }
//   }
// };

const testListfilter = async () => {
  try {
    const response = await axios.get("http://localhost:3001/", {
      params: {
        Date_dgted: "2022-03-23T01:58:02.556+00:00",
        Date_dltd: "2022-03-25T14:19:13.284+00:00",
        StatusCode_igtei: 200,
        StatusCode_igti: 100,
        limit: 10,
        page: 0,
      },
    });

    console.log("✅ Status:", response.status);
    console.log("📦 Data:", response.data);
    console.log("ℹ️ Metadata:", response.data.data?.Metadata);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("🔴 Status Code:", error.response.status);
      console.error("🔴 Response Body:", error.response.data);
    }
  }
};

// test().catch((err) => {
//   console.error("Caught in top-level .catch():", err);
//   process.exit(1);
// });
// testListfilter();
