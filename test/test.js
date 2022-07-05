const { ObjectId } = require("mongodb");

const MongoWraper = require("mongoclienteasywrapper")(
  "mongodb://knesys:knesysiot123@localhost:27017"
);

const apibuildingframeworkexpress = require("apibuildingframeworkexpress")(
  MongoWraper
);
const axios = require("axios");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));

app.get(
  "/",
  apibuildingframeworkexpress.listFilter({
    Database: "EMPRESAGUSTAVO8501348",
    Collection: "historial",
  })
);
//Remove Test
app.delete(
  "/:_id/delete",
  apibuildingframeworkexpress.remove({
    Database: "EMPRESAGUSTAVO8501348",
    Collection: "proyectos",
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
    .get("http://localhost:3000/", {
      params: { abuelita_concat: `[ "$Collection", " ", "$Action" ]` },
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

  console.log("test");
};
// test();
testListfilter();
