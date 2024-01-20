const { ObjectId } = require("mongodb");
const yup = require("yup");
const MongoWraper = require("mongoclienteasywrapper")(
  "mongodb://knesys:knesysiot123@52.248.41.72:27020"
);

const apibuildingframeworkexpress = require("apibuildingframeworkexpress")(
  MongoWraper
);
const axios = require("axios");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));

app.get(
  "/",
  apibuildingframeworkexpress.listFilter2({
    Database: "Demek930165",
    Collection: "testschema",
  })
);
//express validator
const userSchemaExpress = {
  name: {
    isString: true,
    notEmpty: true,
    errorMessage: "Name must be a string",
  },
  apellido: {
    isString: true,
    notEmpty: true,
    errorMessage: "Name must be a string",
  },
  age: {
    isInt: true,
    optional: { options: { nullable: true } },
    errorMessage: "Age must be a number",
  },
};

const userSchemaYup = yup
  .object({
    name: yup.string().required(),
    age: yup.number().positive().integer().required(),
    email: yup.string().email().required(),
  })
  .noUnknown(true, "No extra fields allowed")
  .required()
  .strict();

app.post(
  "/",
  apibuildingframeworkexpress.Middlewares.validateSchemaYup(userSchemaYup),
  (req, res, next) => {
    req.body.apellido = "tello";
    req.body.fullname = req.body.name + req.body.apellido;
    next();
  },
  apibuildingframeworkexpress.create({
    Database: "test",
    Collection: "testschema",
  })
);
//Remove Test
app.delete(
  "/:_id/delete",
  apibuildingframeworkexpress.remove({
    Database: "Demek930165",
    Collection: "ty",
  })
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const test = async () => {
  //   apibuildingframeworkexpress.remove()((req, res, next));
  const IdToDelete = "627d7c68c8cc781a0f281222";
  //   Unlike axios.post() and axios.put(), the 2nd param to axios.delete() is the Axios options, not the request body. To send a request body with a DELETE request, you should use the data option.
  axios
    .delete("http://localhost:3000/" + IdToDelete + "/delete", {
      data: {
        _Unassign: ["subcontratistas"],
        _RecursiveDelete: ["subcontratistas"],
      },
    })
    .then(function (response) {
      // handle success
      console.log("200");
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log("catch");
      console.log(error.response.status);
    });
  //   axios
  //     .get("http://localhost:3000")
  //     .then(function (response) {
  //       // handle success
  //       console.log("200");
  //       console.log(response.data);
  //     })
  //     .catch(function (error) {
  //       // handle error
  //       console.log("catch");
  //       console.log(error.response.status);
  //     });
  console.log("test");
};

const testListfilter = async () => {
  axios
    .get("http://localhost:3001/", {
      params: {
        Date_dgted: "2022-03-23T01:58:02.556+00:00",
        Date_dltd: "2022-03-25T14:19:13.284+00:00",
        StatusCode_igtei: 200,
        StatusCode_igti: 100,
        limit: 10,
        page: 0,
      },
    })
    .then(function (response) {
      // handle success
      console.log("200");
      console.log(response.data);
      console.log(response.data.data.Metadata);
    })
    .catch(function (error) {
      // handle error
      console.log("catch");
      console.log(error.response.status);
    });

  console.log("test");
};
// test();
// testListfilter();
