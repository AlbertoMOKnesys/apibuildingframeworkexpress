require("dotenv").config();
const MongoWraper = require("mongoclienteasywrapper")(process.env.MONGO_URI);
const { sizeObj } = require("../helpers/common");
const ObjectId = require("mongodb").ObjectID;

exports.Assign = async (body, db0, db1) => {
  const collection = Object.keys(body);
  console.log(collection);
  console.log({ [collection[1] + "_id"]: { $each: body[collection[1]] } });
  const PushFirstCollection = await MongoWraper.UpdateMongoManyBy_idAddToSet(
    body[collection[0]],
    {
      [collection[1] + "_id"]: {
        $each: body[collection[1]].map((e) => ObjectId(e)),
      },
    },
    collection[0],
    db0
  );
  // console.log(PushFirstCollection);
  const PushSecondCollection = await MongoWraper.UpdateMongoManyBy_idAddToSet(
    body[collection[1]],
    {
      [collection[0] + "_id"]: {
        $each: body[collection[0]].map((e) => ObjectId(e)),
      },
    },
    collection[1],
    db1
  );

  // console.log(PushSecondCollection);

  return;
};

exports.UnAssing = async (body, db0, db1) => {
  const collection = Object.keys(body);
  console.log(collection);
  console.log({ [collection[1] + "_id"]: { $in: body[collection[1]] } });
  const PullFirstCollection = await MongoWraper.UpdateMongoManyBy_idPull(
    body[collection[0]],
    {
      [collection[1] + "_id"]: {
        $in: body[collection[1]].map((e) => ObjectId(e)),
      },
    },
    collection[0],
    db0
  );
  // console.log(PushFirstCollection);
  const PullSecondCollection = await MongoWraper.UpdateMongoManyBy_idPull(
    body[collection[1]],
    {
      [collection[0] + "_id"]: {
        $in: body[collection[0]].map((e) => ObjectId(e)),
      },
    },
    collection[1],
    db1
  );

  // console.log(PushSecondCollection);

  return;
};
exports.addnew = async (req, res) => {
  await this.Assign(req.body, req.database, req.database);
  const objResp = {
    status: "ok",
    message: "completed",
    data: [],
  };

  res.status(200).send(objResp);
};
exports.add = async (req, res) => {
  const collection = Object.keys(req.body);
  const db = req.database;
  const QuerySubcontratistas = req.body[collection[0]].map((id) => {
    return { _id: ObjectId(id) };
  });

  const QueryObra = req.body[collection[1]].map((id) => {
    return { _id: ObjectId(id) };
  });

  const FullQuerieSubcontratista = { $or: [...QuerySubcontratistas] };
  const FullQuerieQueryObra = { $or: [...QueryObra] };

  const PastValueSubcontratistas = await MongoWraper.FindManyLimit(
    FullQuerieSubcontratista,
    1000,
    collection[0],
    db
  );
  console.log("=========================================================");
  const UpdateStatusSubcontratistasPromise = PastValueSubcontratistas.map(
    async (Subcontratista) => {
      try {
        const ObraArr = Subcontratista[collection[1] + "_id"]
          ? [
              ...req.body[collection[1]],
              ...Subcontratista[collection[1] + "_id"].map((element) =>
                element.toString()
              ),
            ]
          : req.body[collection[1]];
        console.log(
          "========================================================="
        );

        const ObraArrSinRepetidos = ObraArr.filter(
          (element, pos) => pos === ObraArr.indexOf(element)
        ).map((element) => ObjectId(element));
        console.log(ObraArrSinRepetidos);
        const UpdatedSubcontratistas = await MongoWraper.UpdateMongoBy_id(
          Subcontratista._id,
          {
            [collection[1] + "_id"]: ObraArrSinRepetidos,
          },
          collection[0],
          db
        );

        return { [Subcontratista._id]: "ok" };
      } catch (error) {
        console.log(error);
        return { [Subcontratista._id]: "err" };
      }
    }
  );

  const UpdateStatusSubcontratistas = await Promise.all(
    UpdateStatusSubcontratistasPromise
  );

  //console.log(UpdateStatusSubcontratistas);

  const PastValueObra = await MongoWraper.FindManyLimit(
    FullQuerieQueryObra,
    1000,
    collection[1],
    db
  );

  const UpdateStatusObraPromise = PastValueObra.map(async (Obra) => {
    try {
      const SubcontratistaArr = Obra[collection[0] + "_id"]
        ? [
            ...req.body[collection[0]],
            ...Obra[collection[0] + "_id"].map((element) => element.toString()),
          ]
        : req.body[collection[0]];

      const SubcontratistaArrSinRepetidos = SubcontratistaArr.filter(
        (element, pos) => pos === SubcontratistaArr.indexOf(element)
      ).map((element) => ObjectId(element));

      const UpdatedSubcontratistas = await MongoWraper.UpdateMongoBy_id(
        Obra._id,
        {
          [collection[0] + "_id"]: SubcontratistaArrSinRepetidos,
        },
        collection[1],
        db
      );

      return { [Obra._id]: "ok" };
    } catch (error) {
      return { [Obra._id]: "err" };
    }
  });
  const UpdateStatusObra = await Promise.all(UpdateStatusObraPromise);

  const objResp = {
    status: "ok",
    message: "completed",
    data: {
      [collection[0]]: UpdateStatusSubcontratistas,
      [collection[1]]: UpdateStatusObra,
    },
  };

  res.status(200).send(objResp);
};

exports.genDelete = async (body, db) => {
  const collection = Object.keys(body);
  const QuerySubcontratistas = body[collection[0]].map((id) => {
    return { _id: ObjectId(id) };
  });

  const QueryObra = body[collection[1]].map((id) => {
    return { _id: ObjectId(id) };
  });

  const FullQuerieSubcontratista = { $or: [...QuerySubcontratistas] };
  const FullQuerieQueryObra = { $or: [...QueryObra] };

  const PastValueSubcontratistas = await MongoWraper.FindManyLimit(
    FullQuerieSubcontratista,
    1000,
    collection[0],
    db
  );
  console.log("=========================================================");
  const UpdateStatusSubcontratistasPromise = PastValueSubcontratistas.map(
    async (Subcontratista) => {
      try {
        const ObraArr = Subcontratista[collection[1] + "_id"]
          ? [
              ...Subcontratista[collection[1] + "_id"].filter(
                (element) => !body[collection[1]].includes(element.toString())
              ),
            ]
          : [];
        console.log(
          "========================================================="
        );

        const ObraArrSinRepetidos = ObraArr.filter(
          (element, pos) => pos === ObraArr.indexOf(element)
        ).map((element) => ObjectId(element));
        console.log(ObraArrSinRepetidos);
        const UpdatedSubcontratistas = await MongoWraper.UpdateMongoBy_id(
          Subcontratista._id,
          {
            [collection[1] + "_id"]: ObraArrSinRepetidos,
          },
          collection[0],
          db
        );

        return { [Subcontratista._id]: "ok" };
      } catch (error) {
        console.log(error);
        return { [Subcontratista._id]: "err" };
      }
    }
  );

  const UpdateStatusSubcontratistas = await Promise.all(
    UpdateStatusSubcontratistasPromise
  );

  //console.log(UpdateStatusSubcontratistas);

  const PastValueObra = await MongoWraper.FindManyLimit(
    FullQuerieQueryObra,
    1000,
    collection[1],
    db
  );

  const UpdateStatusObraPromise = PastValueObra.map(async (Obra) => {
    try {
      const SubcontratistaArr = Obra[collection[0] + "_id"]
        ? [
            ...Obra[collection[0] + "_id"].filter(
              (element) => !body[collection[0]].includes(element.toString())
            ),
          ]
        : [];

      const SubcontratistaArrSinRepetidos = SubcontratistaArr.filter(
        (element, pos) => pos === SubcontratistaArr.indexOf(element)
      ).map((element) => ObjectId(element));

      const UpdatedSubcontratistas = await MongoWraper.UpdateMongoBy_id(
        Obra._id,
        {
          [collection[0] + "_id"]: SubcontratistaArrSinRepetidos,
        },
        collection[1],
        db
      );

      return { [Obra._id]: "ok" };
    } catch (error) {
      return { [Obra._id]: "err" };
    }
  });
  const UpdateStatusObra = await Promise.all(UpdateStatusObraPromise);

  const data = {
    [collection[0]]: UpdateStatusSubcontratistas,
    [collection[1]]: UpdateStatusObra,
  };
  return data;
};

exports.delete = async (req, res) => {
  const db = req.database;

  const objResp = {
    status: "ok",
    message: "completed",
    data: await this.genDelete(req.body, db),
  };

  res.status(200).send(objResp);
};

exports.deleteOnly1 = async (req, res) => {
  const collection = Object.keys(req.body);
  const db = req.database;
  const QuerySubcontratistas = req.body[collection[0]].map((id) => {
    return { _id: ObjectId(id) };
  });

  const QueryObra = req.body[collection[1]].map((id) => {
    return { _id: ObjectId(id) };
  });

  const FullQuerieSubcontratista = { $or: [...QuerySubcontratistas] };
  const FullQuerieQueryObra = { $or: [...QueryObra] };

  const PastValueSubcontratistas = await MongoWraper.FindManyLimit(
    FullQuerieSubcontratista,
    1000,
    collection[0],
    db
  );
  console.log("=========================================================");
  const UpdateStatusSubcontratistasPromise = PastValueSubcontratistas.map(
    async (Subcontratista) => {
      try {
        const ObraArr = Subcontratista[collection[1] + "_id"]
          ? [
              ...Subcontratista[collection[1] + "_id"].filter(
                (element) =>
                  !req.body[collection[1]].includes(element.toString())
              ),
            ]
          : [];
        console.log(
          "========================================================="
        );

        const ObraArrSinRepetidos = ObraArr.filter(
          (element, pos) => pos === ObraArr.indexOf(element)
        ).map((element) => ObjectId(element));
        console.log(ObraArrSinRepetidos);
        const UpdatedSubcontratistas = await MongoWraper.UpdateMongoBy_id(
          Subcontratista._id,
          {
            [collection[1] + "_id"]: ObraArrSinRepetidos,
          },
          collection[0],
          db
        );

        return { [Subcontratista._id]: "ok" };
      } catch (error) {
        console.log(error);
        return { [Subcontratista._id]: "err" };
      }
    }
  );

  const UpdateStatusSubcontratistas = await Promise.all(
    UpdateStatusSubcontratistasPromise
  );

  const objResp = {
    status: "ok",
    message: "completed",
    data: {
      [collection[0]]: UpdateStatusSubcontratistas,
    },
  };

  res.status(200).send(objResp);
};
