const { sizeObj } = require("./common");
// const ObjectId = require("mongodb").ObjectID;
const ObjectId = require("mongodb").ObjectId;
const fs = require("fs");
const uploadfileDatos = require("./uploadFileData");
const uploadfileDatosNew = require("./uploadFileDataNew");
// const { ipServer } = require("../config/vars");
const { ApiError, ApiErrorData } = require("./ApiError");
const { nextTick } = require("process");
const re = /[a-zA-Z0-9_-]+/;
const operatorNotDeleted = { status: { $ne: "deleted" } };
const Oculta = { oculta: { $ne: true } };

const Assign = async (body, db0, db1) => {
  const collection = Object.keys(body);
  console.log(collection);
  //   {
  //     "asistencias": ["61f801cdb6153a0034c123ec"]
  // collection:[id]
  //   }

  console.log({ [collection[1] + "_id"]: { $each: body[collection[1]] } });
  const PushFirstCollection = await MongoWraper.UpdateMongoManyBy_idAddToSet(
    // ["61f801cdb6153a0034c123ec"]
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

const UnAssign = async (body, db0, db1) => {
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
const UnAssignIdToCollections = async (collection, field, id, db) => {
  // console.log("col", collection);
  // console.log("fie", field);
  // console.log("id", id);
  const PullCollection =
    await MongoWraper.UpdateMongoManyPullIDToCollectionPull(
      { [field + "_id"]: ObjectId(id) },
      collection,
      db
    );

  return;
};

function objectIdWithTimestamp(timestamp) {
  /* Convert string date to Date object (otherwise assume timestamp is a date) */
  if (typeof timestamp == "string") {
    timestamp = new Date(timestamp);
  }

  /* Convert date object to hex seconds since Unix epoch */
  var hexSeconds = Math.floor(timestamp / 1000).toString(16);

  /* Create an ObjectId with that hex timestamp */
  var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

  return constructedObjectId;
}
const CreateAndArr = (req) => {
  const NonTextFields = ["page", "limit", "initialDate", "finalDate"];

  const andArr = Object.keys(req.query)
    .filter((prop) => !NonTextFields.includes(prop))
    .map((prop, index) =>
      req.query[prop] == { [prop]: { $regex: "", $options: "si" } }
        ? []
        : req.query[prop].split(" ").map((word) => {
            return { [prop]: { $regex: word, $options: "si" } };
          })
    );

  return andArr;
};
const GetGenericQueryId = (Query) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.reduce((acum, ArrSearch) => {
      const QuerySpecific = [{ [Query.Property]: ObjectId(ArrSearch) }];
      return [...acum, ...QuerySpecific];
    }, []);
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return { $or: [...QueriesArrProp] };
  } else {
    const QuerySpecific = [{ [Query.Property]: ObjectId(Query.Search) }];
    return { $or: [...QuerySpecific] };
  }
};
const GetGenericQueryBool = (Query) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.reduce((acum, ArrSearch) => {
      const QuerySpecific = [{ [Query.Property]: ArrSearch == "true" }];
      return [...acum, ...QuerySpecific];
    }, []);
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return { $or: [...QueriesArrProp] };
  } else {
    const QuerySpecific = [{ [Query.Property]: Query.Search == "true" }];
    return { $or: [...QuerySpecific] };
  }
};
const GetGenericQueryString = (Query) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.reduce((acum, ArrSearch) => {
      const QuerySpecific = [{ [Query.Property]: ArrSearch }];
      return [...acum, ...QuerySpecific];
    }, []);
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return { $or: [...QueriesArrProp] };
  } else {
    const QuerySpecific = [{ [Query.Property]: Query.Search }];
    return { $or: [...QuerySpecific] };
  }
};
const GetGenericQueryNeid = (Query) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.map((ArrSearch) => {
      return { [Query.Property]: { $ne: ObjectId(ArrSearch) } };
    });
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return { $and: [...QueriesArrProp] };
  } else {
    return { [Query.Property]: { $ne: ObjectId(Query.Search) } };
  }
};

const GetGenericQueryNestring = (Query) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.map((ArrSearch) => {
      return { [Query.Property]: { $ne: ArrSearch } };
    });
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return { $and: [...QueriesArrProp] };
  } else {
    return { [Query.Property]: { $ne: Query.Search } };
  }
};

const GetGenericQueryPartial = (Query) => {
  //const NonTextFields = ["page", "limit", "initialDate", "finalDate"];
  const fullAndArray = Query.Search.split(" ").map((word) => {
    return { [Query.Property]: { $regex: word, $options: "si" } };
  });

  return { $and: fullAndArray };
};
//probado
const list = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match(re)[0];
  console.log("collection", collection);
  const hasOrder =
    req.user.order !== undefined && req.user.order[collection] !== undefined
      ? req.user.order[collection]
      : {};
  console.log("hasOrder: ", hasOrder);
  const QueryFull = { ...req.query };
  delete req.query.showdeleted;
  delete req.query.showoculta;
  var sizeQuery = sizeObj(req.query);

  if (sizeQuery > 0) {
    /// CON paginado infinito
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit);

    const andArr = CreateAndArr(req);

    const fullAndArray = andArr.reduce((acum, arr) => [...acum, ...arr], []);

    const exampleQuerie = {
      $and: [
        ...fullAndArray,
        QueryFull.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted,
        QueryFull.hasOwnProperty("showoculta") ? {} : Oculta,
      ],
    };
    console.log(exampleQuerie);
    /* Find all documents created after midnight on May 25th, 1980 */
    // db.mycollection.find({ _id: { $gt: objectIdWithTimestamp("1980/05/25") } });
    if (req.query.initialDate || req.query.finalDate) {
      const gte = new Date(req.query.initialDate);
      const lt = new Date(req.query.finalDate);

      exampleQuerie.$and.push({
        _id: {
          $gte: objectIdWithTimestamp(req.query.initialDate),
          $lt: objectIdWithTimestamp(req.query.finalDate),
        },
      });
    }

    const cuandoNoVienenFiltros = { $and: [] };

    let query =
      JSON.stringify(cuandoNoVienenFiltros) == JSON.stringify(exampleQuerie)
        ? {}
        : exampleQuerie;
    console.log("+++++++++++++++++++++++++Queryy Full2+++++++++++++++++++++");
    console.log(JSON.stringify(query));

    try {
      const dbResponse = await MongoWraper.FindPaginated(
        query,
        page,
        limit,
        collection,
        db
      );

      const acople = dbResponse.map((generic) => {
        if (hasOrder[generic._id] !== undefined)
          return { ...generic, lastUse: hasOrder[generic._id] };
        else return { ...generic, lastUse: 0 };
      });
      const objResp = {
        status: "ok",
        message: "completed",
        rows: acople.length,
        data: acople,
      };
      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }
      res.status(200).send(objResp);
    } catch (err) {
      const objResp = {
        status: "error",
        message: "db error",
        data: err,
      };
      res.status(400).send(objResp);
    }
  } else {
    try {
      // /// SIN  paginado
      const exampleQuerie = {
        $and: [
          QueryFull.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted,
          QueryFull.hasOwnProperty("showoculta") ? {} : Oculta,
        ],
      };
      // const query = {};
      const dbResponse = await MongoWraper.PopulateAuto(
        exampleQuerie,
        collection,
        db
      );

      const acople = dbResponse.map((generic) => {
        if (hasOrder[generic._id] !== undefined)
          return { ...generic, lastUse: hasOrder[generic._id] };
        else return { ...generic, lastUse: 0 };
      });
      const objResp = {
        status: "ok",
        message: "completed",
        rows: acople.length,
        data: acople,
      };
      res.status(200).send(objResp);
    } catch (err) {
      const objResp = {
        status: "error",
        message: "db error",
        data: err,
      };
      res.status(400).send(objResp);
    }
  }
};

const listOne = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  // console.log(req.originalUrl);
  // console.log(req.originalUrl);
  //   const collection = req.originalUrl.match(re)[0];

  try {
    const dbResponse = await MongoWraper.ND_FindIDOnePopulated(
      req.params._id,
      collection,
      db
    );

    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponse == null ? {} : dbResponse,
    };
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }
    res.status(200).send(objResp);
  } catch (err) {
    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }
};

const createMultipleCore = (params) => async (req, res, next) => {
  params = params ? params : {};
  const {
    Database,
    Collection,
    PathBaseFile,
    URL,
    ApiErrorFailDb,
    AsyncFunctionAfter,
    Middleware,
  } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  // const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  // const Db = Database ? Database : req.database;

  //codigo nuevo para asignar al momento de insertar

  const objToSave = { ...req.body, datetime: new Date() };
  console.log(objToSave);
  //Guadando asignaciones para que no se inserten junto con el body
  let Asignaciones = req.body.hasOwnProperty("_Assign") ? req.body._Assign : [];

  delete req.body._Assign;

  //Insertando en DB\
  console.log("llego hasta acaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  console.log(req.body);
  let dbResponse;
  try {
    dbResponse = await MongoWraper.SavetoMongo(objToSave, collection, db);
  } catch (err) {
    console.log(err);

    throw new ApiErrorData(
      400,
      ApiErrorFailDb ? ApiErrorFailDb : "db error",
      err
    );
  }

  //codigo nuevo para asignar al momento de insertar
  //agregando id de lo que acabamos de insertar a la asignacion
  // "_Assign": [
  //   {
  //     "asistencias": ["61f801cdb6153a0034c123ec"]
  //   }
  // ]
  Asignaciones = Asignaciones.map((e) => {
    //   {
    //     "asistencias": ["61f801cdb6153a0034c123ec"]
    // collection:[id]
    //   }
    return { ...e, [collection]: [dbResponse.insertedId] };
  });
  //

  const PromisesAssign = Asignaciones.map((e) => Assign(e, db, db));

  await Promise.all(PromisesAssign);

  //Si venia un archivo y paso por todo lo movemos a su lugar definitivo
  if (req.files) {
    // const dirDestino = `${__basedir}/files/${Db}/${collection}/${dbResponse.insertedId}/`;
    const dirDestino = `${PathBaseFile}/${db}/${collection}/${dbResponse.insertedId}/`;
    if (!fs.existsSync(dirDestino)) {
      fs.mkdirSync(dirDestino, { recursive: true });
    }
    const fotofile = req.files.file[0];
    const pathDestino = dirDestino + fotofile.filename;
    fs.renameSync(fotofile.path, pathDestino);
    //actualizando el directorio al que se movio

    // const foto = `${ipServer}/api/v1/rules/fs/files/${Db}/${collection}/${dbResponse.insertedId}/${fotofile.filename}`;
    const foto = `${URL}/${db}/${collection}/${dbResponse.insertedId}/${fotofile.filename}`;
    await MongoWraper.UpdateMongoBy_id(
      dbResponse.insertedId,
      {
        foto: foto,
        fotopath: pathDestino,
      },
      collection,
      db
    );

    req.body.foto = foto;
    req.body.fotopath = pathDestino;
  }

  const dbResponseFind = await MongoWraper.FindOne(
    dbResponse.insertedId,
    collection,
    db
  );

  if (AsyncFunctionAfter) {
    await AsyncFunctionAfter(req, res, dbResponse);
  }

  //TODO regresar en la respuesta si las asignaciones fueron correctas

  const objResp = {
    status: "ok",
    message: "completed",
    data: dbResponseFind,
    extra: req.extraresponse,
  };
  if (Middleware) {
    req.MidResponse = objResp;
    return next();
  }
  return objResp;
};

const create = (params) => async (req, res, next) => {
  params = params ? params : {};
  const {
    Database,
    Collection,
    PathBaseFile,
    URL,
    ApiErrorFailDb,
    AsyncFunctionAfter,
    Middleware,
  } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  // const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  // const Db = Database ? Database : req.database;

  //codigo nuevo para asignar al momento de insertar

  const objToSave = { ...req.body, datetime: new Date() };
  console.log(objToSave);
  //Guadando asignaciones para que no se inserten junto con el body
  let Asignaciones = req.body.hasOwnProperty("_Assign") ? req.body._Assign : [];

  delete req.body._Assign;

  //Insertando en DB\
  console.log("llego hasta acaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  console.log(req.body);
  let dbResponse;
  try {
    dbResponse = await MongoWraper.SavetoMongo(objToSave, collection, db);
  } catch (err) {
    console.log(err);

    throw new ApiErrorData(
      400,
      ApiErrorFailDb ? ApiErrorFailDb : "db error",
      err
    );
  }

  //codigo nuevo para asignar al momento de insertar
  //agregando id de lo que acabamos de insertar a la asignacion
  // "_Assign": [
  //   {
  //     "asistencias": ["61f801cdb6153a0034c123ec"]
  //   }
  // ]
  Asignaciones = Asignaciones.map((e) => {
    //   {
    //     "asistencias": ["61f801cdb6153a0034c123ec"]
    // collection:[id]
    //   }
    return { ...e, [collection]: [dbResponse.insertedId] };
  });
  //

  const PromisesAssign = Asignaciones.map((e) => Assign(e, db, db));

  await Promise.all(PromisesAssign);

  //Si venia un archivo y paso por todo lo movemos a su lugar definitivo
  if (req.files) {
    // const dirDestino = `${__basedir}/files/${Db}/${collection}/${dbResponse.insertedId}/`;
    const dirDestino = `${PathBaseFile}/${db}/${collection}/${dbResponse.insertedId}/`;
    if (!fs.existsSync(dirDestino)) {
      fs.mkdirSync(dirDestino, { recursive: true });
    }
    const fotofile = req.files.file[0];
    const pathDestino = dirDestino + fotofile.filename;
    fs.renameSync(fotofile.path, pathDestino);
    //actualizando el directorio al que se movio

    // const foto = `${ipServer}/api/v1/rules/fs/files/${Db}/${collection}/${dbResponse.insertedId}/${fotofile.filename}`;
    const foto = `${URL}/${db}/${collection}/${dbResponse.insertedId}/${fotofile.filename}`;
    await MongoWraper.UpdateMongoBy_id(
      dbResponse.insertedId,
      {
        foto: foto,
        fotopath: pathDestino,
      },
      collection,
      db
    );

    req.body.foto = foto;
    req.body.fotopath = pathDestino;
  }

  const dbResponseFind = await MongoWraper.FindOne(
    dbResponse.insertedId,
    collection,
    db
  );

  if (AsyncFunctionAfter) {
    await AsyncFunctionAfter(req, res, dbResponse);
  }

  //TODO regresar en la respuesta si las asignaciones fueron correctas

  const objResp = {
    status: "ok",
    message: "completed",
    data: dbResponseFind,
    extra: req.extraresponse,
  };
  if (Middleware) {
    req.MidResponse = objResp;
    return next();
  }
  res.status(200).send(objResp);
  // res
  // .status(200)
  // .send({ status: "ok", message: "face indexed", data: percentageUpdate });
};

const updatePatch = (params) => async (req, res, next) => {
  params = params ? params : {};
  const {
    Database,
    Collection,
    PathBaseFile,
    URL,
    ApiErrorFailDb,
    AsyncFunctionAfter,
    Middleware,
  } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  // const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  // const Db = Database ? Database : req.database;

  //Guadando asignaciones para que no se inserten junto con el body
  let Asignaciones = req.body.hasOwnProperty("_Assign") ? req.body._Assign : [];

  delete req.body._Assign;

  let DesAsignaciones = req.body.hasOwnProperty("_UnAssign")
    ? req.body._UnAssign
    : [];

  delete req.body._UnAssign;

  let dbResponse;
  try {
    dbResponse = await MongoWraper.UpdateMongoBy_id(
      req.params._id,
      req.body,
      collection,
      db
    );
  } catch (err) {
    console.log(err);

    throw new ApiErrorData(
      400,
      ApiErrorFailDb ? ApiErrorFailDb : "db error",
      err
    );
  }

  Asignaciones = Asignaciones.map((e) => {
    //   {
    //     "asistencias": ["61f801cdb6153a0034c123ec"]
    // collection:[id]
    //   }
    return { ...e, [collection]: [req.params._id] };
  });
  //

  const PromisesAssign = Asignaciones.map((e) => Assign(e, db, db));

  await Promise.all(PromisesAssign);

  DesAsignaciones = DesAsignaciones.map((e) => {
    //   {
    //     "asistencias": ["61f801cdb6153a0034c123ec"]
    // collection:[id]
    //   }
    return { ...e, [collection]: [req.params._id] };
  });
  //

  const PromisesUnAssign = DesAsignaciones.map((e) => UnAssign(e, db, db));

  await Promise.all(PromisesUnAssign);

  //ejecutando funcion extra si es requerido
  if (AsyncFunctionAfter) {
    await AsyncFunctionAfter(req, res, dbResponse);
  }

  //Si venia un archivo y paso por todo lo movemos a su lugar definitivo
  if (req.files) {
    // const dirDestino = `${__basedir}/files/${Db}/${collection}/${req.params._id}/`;
    const dirDestino = `${PathBaseFile}/${db}/${collection}/${req.params._id}/`;
    if (!fs.existsSync(dirDestino)) {
      fs.mkdirSync(dirDestino, { recursive: true });
    }
    const fotofile = req.files.file[0];
    const pathDestino = dirDestino + fotofile.filename;
    fs.renameSync(fotofile.path, pathDestino);
    //actualizando el directorio al que se movio

    await MongoWraper.UpdateMongoBy_id(
      req.params._id,
      {
        // foto: `${ipServer}/api/v1/rules/fs/files/${Db}/${collection}/${req.params._id}/${fotofile.filename}`,
        foto: `${URL}/${db}/${collection}/${req.params._id}/${fotofile.filename}`,
        fotopath: pathDestino,
      },
      collection,
      db
    );
  }

  const objResp = {
    status: "ok",
    message: "completed",
    data: dbResponse,
  };
  if (Middleware) {
    req.MidResponse = objResp;
    return next();
  }
  res.status(200).send(objResp);
};
const updatePatchMany = (params) => async (req, res, next) => {
  params = params ? params : {};
  const {
    Database,
    Collection,
    PathBaseFile,
    URL,
    ApiErrorFailDb,
    AsyncFunctionAfter,
    Middleware,
  } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  // const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  // const Db = Database ? Database : req.database;

  //Guadando asignaciones para que no se inserten junto con el body

  let dbResponse;
  try {
    dbResponse = await MongoWraper.UpdateMongoMany(
      req.body.query,
      req.body.newProperties,
      collection,
      db
    );
  } catch (err) {
    console.log(err);

    throw new ApiErrorData(
      400,
      ApiErrorFailDb ? ApiErrorFailDb : "db error",
      err
    );
  }

  const objResp = {
    status: "ok",
    message: "completed",
    data: dbResponse,
  };
  if (Middleware) {
    req.MidResponse = objResp;
    return next();
  }
  res.status(200).send(objResp);
};
const remove = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match(re)[0];
  console.log("entre a remove");

  let Desasignaciones = req.body.hasOwnProperty("_Unassign")
    ? req.body._Unassign
    : [];
  console.log(Desasignaciones);
  delete req.body._Unassign;

  let RecursiveDelete = req.body.hasOwnProperty("_RecursiveDelete")
    ? req.body._RecursiveDelete
    : [];
  console.log(RecursiveDelete);
  delete req.body._RecursiveDelete;

  try {
    const dbResponse = await MongoWraper.ND_DeleteMongoby_id(
      req.params._id,
      collection,
      db
    );

    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponse,
    };

    const PromisesRecursiveDelete = RecursiveDelete.map((collectionDelete) =>
      MongoWraper.UpdateMongoMany(
        { [collection + "_id"]: req.params._id },
        { status: "deleted" },
        collectionDelete,
        db
      )
    );
    await Promise.all(PromisesRecursiveDelete);
    // Desasignaciones = Desasignaciones.map((e) => {
    //   //   {
    //   //     "asistencias": ["61f801cdb6153a0034c123ec"]
    //   // collection:[id]
    //   //   }
    //   return { ...e, [collection]: [dbResponse.insertedId] };
    // });
    // //

    const PromisesUnAssign = Desasignaciones.map((collectionDelete) =>
      UnAssignIdToCollections(collectionDelete, collection, req.params._id, db)
    );

    await Promise.all(PromisesUnAssign);

    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }
    res.status(200).send(objResp);
  } catch (err) {
    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }
};

//Agrega icono
const docUpload = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match(re)[0];
  console.log("adding picture to generic with picture... " + collection);

  //   const dir = `${__basedir}/files/${db}/${collection}/${req.params._id}/`;
  const dir = `${PathBaseFile}/${db}/${collection}/${req.params._id}/`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  req.folder = dir;

  try {
    console.log("debug:", "print before upload");

    await uploadfileDatos(req, res);
    console.log("debug:", "print after upload");
    if (req.files === undefined) {
      /// en caso de que no se este subiendo archivos del modo adecuado
      let objResp = {
        status: "error",
        message: "Please upload a file!",
        data: "",
      };
      return res.status(400).send(objResp);
    } else {
      /// parseando datos que vengan como json dentro de form-data    ############################################
      console.log("debug:", req.params._id);
      console.log("debug:", req.body.data);

      console.log("debug:", "adding url to body");
      const data = JSON.parse(req.body.data);
      console.log(data.name);
      //   const url = `${ipServer}/api/v1/rules/fs/files/${db}/${collection}/${req.params._id}/${req.files.file[0].filename}`;
      const url = `${URL}/${db}/${collection}/${req.params._id}/${req.files.file[0].filename}`;
      console.log("debug:", url);
      console.log("debug:", req.files.file[0].path);
      const newProperty = {
        [data.name]: {
          url: url,
          path: req.files.file[0].path,
        },
      };
      console.log("debug:", "updating on mongo");
      console.log("debug:", req.params._id);
      console.log("debug:", newProperty);
      console.log("debug:", collection);
      console.log("debug:", db);
      /// actualizar nuevos datos de rek y la nueva carpeta de trabajadores    ############################################
      await MongoWraper.UpdateMongoBy_id(
        req.params._id,
        newProperty,
        collection,
        db
      ).catch((err) => {
        const objResp = {
          status: "error",
          message: "db error",
          data: err,
        };
        res.status(400).send(objResp);
      });

      console.log("debug:", "buscando el ID colocado para finalizar");

      const dbFind = await MongoWraper.FindIDOne(
        req.params._id,
        collection,
        req.database
      );

      const objResp = {
        status: "ok",
        message: "completed",
        data: dbFind,
      };
      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }
      res.status(200).send(objResp);
    }
  } catch (err) {
    /// en aso de que ocurra algun error en la subida de los archivos   ############################################
    console.log(err);
    const objResp = {
      status: "error",
      data: err,
    };
    if (err.code == "LIMIT_FILE_SIZE") {
      objResp.message = "File size cannot be larger than 50MB!";
      return res.status(400).send(objResp);
    }
    objResp.message = `Could not upload the file. ${err}`;
    return res.status(400).send(objResp);
  }
};
//Remueve icono
const docRemove = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match(re)[0];

  try {
    const dbFind = await MongoWraper.FindIDOne(req.params._id, collection, db);

    console.log("aquivoy");
    console.log(dbFind[req.body.name]);

    if (dbFind[req.body.name]) {
      const propertyToRemove = dbFind[req.body.name];

      /// borrando archivo del viejo registro
      fs.unlinkSync(propertyToRemove.path);

      await MongoWraper.UpdateMongoBy_idRemoveProperty(
        req.params._id,
        req.body.name,
        collection,
        db
      );

      const lastFind = await MongoWraper.FindIDOne(
        req.params._id,
        collection,
        db
      );

      const objResp = {
        status: "ok",
        message: "completed",
        data: lastFind,
      };
      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }
      res.status(200).send(objResp);
    } else {
      const objResp = {
        status: "error",
        message: "property not found",
        data: "",
      };
      res.status(400).send(objResp);
    }
  } catch (err) {
    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }

  // if (!fs.existsSync(dir)) {
  //   fs.mkdirSync(dir, { recursive: true });
  // }
  // req.folder = dir;

  // try {
  //   await uploadfileDatos(req, res);

  //   if (req.files === undefined) {
  //     /// en caso de que no se este subiendo archivos del modo adecuado
  //     let objResp = {
  //       status: "error",
  //       message: "Please upload a file!",
  //       data: "",
  //     };
  //     return res.status(400).send(objResp);
  //   } else {
  //     /// parseando datos que vengan como json dentro de form-data    ############################################
  //     console.log(req.body.data);
  //     const data = JSON.parse(req.body.data);
  //     console.log(data.name);
  //     const url = `http://${ipServer}:8050/files/${req.database}/${collection}/${req.params._id}/${req.files.file[0].filename}`;
  //     const newProperty = {
  //       [data.name]: {
  //         url: url,
  //         path: req.files.file[0].path,
  //       },
  //     };

  //     /// actualizar nuevos datos de rek y la nueva carpeta de trabajadores    ############################################
  //     const updated = await MongoWraper.UpdateMongoBy_id(
  //       req.params._id,
  //       newProperty,
  //       collection,
  //       req.database
  //     ).catch((err) => {
  //       const objResp = {
  //         status: "error",
  //         message: "db error",
  //         data: err,
  //       };
  //       res.status(400).send(objResp);
  //     });

  //     const objResp = {
  //       status: "ok",
  //       message: "completed",
  //       data: updated.result,
  //     };
  //     res.status(200).send(objResp);
  //   }
  // } catch (err) {
  //   /// en aso de que ocurra algun error en la subida de los archivos   ############################################
  //   console.log(err);
  //   const objResp = {
  //     status: "error",
  //     data: err,
  //   };
  //   if (err.code == "LIMIT_FILE_SIZE") {
  //     objResp.message = "File size cannot be larger than 50MB!";
  //     return res.status(400).send(objResp);
  //   }
  //   objResp.message = `Could not upload the file. ${err}`;
  //   return res.status(400).send(objResp);
  // }
};
const fileUpload = (params) => async (req, res, next) => {
  params = params ? params : {};
  const {
    Database,
    Collection,
    PropertyNameFile,
    PathBaseFile,
    URL,
    Middleware,
  } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const propertyNameFile = PropertyNameFile ? PropertyNameFile : "documentos";
  const db = Database ? Database : req.database;

  const dir = `${PathBaseFile}/${db}/tmp/`;
  //   const collection = req.originalUrl.match
  //   const collection = req.originalUrl.match(re)[0];
  console.log("uploading files... " + collection);
  //   const dir = __basedir + "/files/" + req.database + "/tmp/";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  req.folder = dir;

  try {
    const DocumentUpload = await MongoWraper.FindIDOne(
      req.params._id,
      collection,
      db
    ).catch((err) => {
      return null;
    });
    if (DocumentUpload == null) {
      const objResp = {
        status: "error",
        message: "_id no econtrado",
        data: {},
      };
      console.log(objResp);
      return res.status(400).send(objResp);
    }

    await uploadfileDatosNew(req, res);

    if (req.files === undefined) {
      /// en caso de que no se este subiendo archivos del modo adecuado
      let objResp = {
        status: "error",
        message: "Please upload a file!",
        data: "",
      };
      return res.status(400).send(objResp);
    }
    // // moviendo archivo de temporal a la carpeta trabajador     ############################################
    //   const dirDestino = `${__basedir}/files/${req.database}/${collection}/${req.params._id}/`;

    const BodyParsed = JSON.parse(JSON.stringify(req.body));
    const docTopush = DoctObjBuilder(
      req.files,
      URL,
      PathBaseFile,
      db,
      collection,
      req.params._id,
      BodyParsed
    );

    //   [propertyNameFile]: {
    //     //   file: `${ipServer}/api/v1/rules/fs/files/${req.database}/${collection}/${req.params._id}/${req.files.file[0].filename}`,
    //     file: `${URL}/${db}/${collection}/${req.params._id}/${req.files.file[0].filename}`,
    //     filepath: pathDestino,
    //     datetime: new Date(),
    //     ...body,
    //   },
    // };

    await MongoWraper.UpdateMongoBy_idPush(
      req.params._id,
      docTopush,
      collection,
      db
    ).catch((err) => {
      const objResp = {
        status: "error",
        message: "db error",
        data: err,
      };
      res.status(400).send(objResp);
    });

    const FinalObject = await MongoWraper.FindIDOne(
      req.params._id,
      collection,
      db
    ).catch((err) => {
      return null;
    });

    const objResp = {
      status: "ok",
      message: "document added",
      data: FinalObject,
    };
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }
    res.status(200).send(objResp);
  } catch (err) {
    /// en aso de que ocurra algun error en la subida de los archivos   ############################################
    console.log(err);
    const objResp = {
      status: "error",
      data: err,
    };
    if (err.code == "LIMIT_FILE_SIZE") {
      objResp.message = "File size cannot be larger than 50MB!";
      return res.status(400).send(objResp);
    }
    objResp.message = `Could not upload the file. ${err}`;
    return res.status(400).send(objResp);
  }
};

const DoctObjBuilder = (
  files,
  URL,
  PathBaseFile,
  db,
  collection,
  id,
  bodyParsed
) => {
  const dirDestino = `${PathBaseFile}/${db}/${collection}/${id}/`;

  // const docTopush = {
  //   [propertyNameFile]: {
  //     $each: DocsArr,
  //   },
  // };
  return files.reduce((acum, file) => {
    const pathDestino = dirDestino + file.filename;
    if (!fs.existsSync(dirDestino)) {
      fs.mkdirSync(dirDestino, { recursive: true });
    }
    fs.renameSync(file.path, pathDestino);
    var filebody = {};
    var keyName = "documentos";
    if (bodyParsed.hasOwnProperty("data_" + file.fieldname)) {
      filebody = JSON.parse(bodyParsed["data_" + file.fieldname]);
      if (filebody.hasOwnProperty("keyName")) {
        keyName = filebody.keyName;
      }

      delete filebody.keyName;
    }
    if (acum.hasOwnProperty(keyName)) {
      const ActualData = acum[keyName]["$each"];
      acum[keyName] = {
        $each: [
          ...ActualData,
          {
            file: `${URL}/${db}/${collection}/${id}/${file.filename}`,
            filepath: pathDestino,
            datetime: new Date(),
            ...filebody,
          },
        ],
      };
      console.log(acum);
    } else {
      acum[keyName] = {
        $each: [
          {
            file: `${URL}/${db}/${collection}/${id}/${file.filename}`,
            filepath: pathDestino,
            datetime: new Date(),
            ...filebody,
          },
        ],
      };
    }
    return acum;
  }, {});

  // {
  //   //   file: `${ipServer}/api/v1/rules/fs/files/${req.database}/${collection}/${req.params._id}/${req.files.file[0].filename}`,
  //   file: `${URL}/${db}/${collection}/${req.params._id}/${req.files.file[0].filename}`,
  //   filepath: pathDestino,
  //   datetime: new Date(),
  //   ...body,
  // }
};
//Agrega Docuemento
const uploadAdd = (params) => async (req, res, next) => {
  params = params ? params : {};
  const {
    Database,
    Collection,
    PropertyNameFile,
    PathBaseFile,
    URL,
    Middleware,
  } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const propertyNameFile = PropertyNameFile ? PropertyNameFile : "documentos";

  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match
  //   const collection = req.originalUrl.match(re)[0];
  console.log("uploading files... " + collection);
  //   const dir = __basedir + "/files/" + req.database + "/tmp/";
  const dir = `${PathBaseFile}/${db}/tmp/`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  req.folder = dir;

  try {
    const docSubcontratista = await MongoWraper.FindIDOne(
      req.params._id,
      collection,
      db
    ).catch((err) => {
      return null;
    });
    if (docSubcontratista == null) {
      const objResp = {
        status: "error",
        message: "_id no econtrado",
        data: {},
      };
      console.log(objResp);
      return res.status(400).send(objResp);
    }

    await uploadfileDatos(req, res);

    if (req.files === undefined) {
      /// en caso de que no se este subiendo archivos del modo adecuado
      let objResp = {
        status: "error",
        message: "Please upload a file!",
        data: "",
      };
      return res.status(400).send(objResp);
    } else {
      // // moviendo archivo de temporal a la carpeta trabajador     ############################################
      //   const dirDestino = `${__basedir}/files/${req.database}/${collection}/${req.params._id}/`;
      const dirDestino = `${PathBaseFile}/${db}/${collection}/${req.params._id}/`;
      const pathDestino = dirDestino + req.files.file[0].filename;
      if (!fs.existsSync(dirDestino)) {
        fs.mkdirSync(dirDestino, { recursive: true });
      }
      fs.renameSync(req.files.file[0].path, pathDestino);

      /// parseando datos que vengan como json dentro de form-data    ############################################
      const body = JSON.parse(req.body.data);
      const docTopush = {
        [propertyNameFile]: {
          //   file: `${ipServer}/api/v1/rules/fs/files/${req.database}/${collection}/${req.params._id}/${req.files.file[0].filename}`,
          file: `${URL}/${db}/${collection}/${req.params._id}/${req.files.file[0].filename}`,
          filepath: pathDestino,
          datetime: new Date(),
          ...body,
        },
      };

      /// actualizar nuevos datos de rek y la nueva carpeta de trabajadores    ############################################
      await MongoWraper.UpdateMongoBy_idPush(
        req.params._id,
        docTopush,
        collection,
        db
      ).catch((err) => {
        const objResp = {
          status: "error",
          message: "db error",
          data: err,
        };
        res.status(400).send(objResp);
      });

      docSubcontratista2 = await MongoWraper.FindIDOne(
        req.params._id,
        collection,
        db
      ).catch((err) => {
        return null;
      });

      const objResp = {
        status: "ok",
        message: "document added",
        data: docSubcontratista2,
      };
      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }
      res.status(200).send(objResp);
    }
  } catch (err) {
    /// en aso de que ocurra algun error en la subida de los archivos   ############################################
    console.log(err);
    const objResp = {
      status: "error",
      data: err,
    };
    if (err.code == "LIMIT_FILE_SIZE") {
      objResp.message = "File size cannot be larger than 50MB!";
      return res.status(400).send(objResp);
    }
    objResp.message = `Could not upload the file. ${err}`;
    return res.status(400).send(objResp);
  }
};

//Actualiza Docuemento
const uploadPatch = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match(re)[0];

  console.log("Updating files... " + collection);
  const dir = `${PathBaseFile}/${req.database}/tmp/`;
  //   const dir = __basedir + "/files/" + req.database + "/tmp/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  req.folder = dir;

  try {
    const docSubcontratista = await MongoWraper.FindIDOne(
      req.params._id,
      collection,
      db
    ).catch((err) => {
      return null;
    });
    if (docSubcontratista == null) {
      const objResp = {
        status: "error",
        message: "_id del trabajador no econtrado",
        data: {},
      };
      console.log(objResp);
      return res.status(400).send(objResp);
    }

    await uploadfileDatos(req, res);
    if (req.files === undefined) {
      /// en caso de que no se este subiendo archivos del modo adecuado
      let objResp = {
        status: "error",
        message: "Please upload a file!",
        data: "",
      };
      return res.status(400).send(objResp);
    } else {
      /// si existen registros en ese array
      const body = JSON.parse(req.body.data);
      const existeAlguno = docSubcontratista.documentos.filter((carga) =>
        carga.filename === body.filename ? carga : null
      );
      if (existeAlguno) {
        // // moviendo archivo de temporal a la carpeta trabajador     ############################################
        // const dirDestino = `${__basedir}/files/${db}/${collection}/${req.params._id}/`;
        // `${__basedir}/files/${req.database}/${collection}/${req.params._id}/`;
        const dirDestino = `${PathBaseFile}/${db}/${collection}/${req.params._id}/`;
        const pathDestino = dirDestino + req.files.file[0].filename;
        fs.renameSync(req.files.file[0].path, pathDestino);

        console.log(existeAlguno[0].filepath);
        /// borrando archivo del viejo registro
        fs.unlinkSync(existeAlguno[0].filepath);

        // body.file = `${ipServer}/api/v1/rules/fs/files/${db}/${collection}/${req.params._id}/${req.files.file[0].filename}`;
        body.file = `${URL}/${collection}/${req.params._id}/${req.files.file[0].filename}`;
        body.filepath = pathDestino;
        const cargas = docSubcontratista.documentos.map((carga) =>
          carga.filename === body.filename ? body : carga
        );
        docSubcontratista.documentos = cargas;

        /// actualizar nuevos datos de rek y la nueva carpeta de trabajadores    ############################################
        await MongoWraper.UpdateMongoBy_id(
          req.params._id,
          docSubcontratista,
          collection,
          db
        ).catch((err) => {
          const objResp = {
            status: "error",
            message: "db error",
            data: err,
          };
          res.status(400).send(objResp);
        });

        const objResp = {
          status: "ok",
          message: "document updated",
          data: docSubcontratista,
        };
        if (Middleware) {
          req.MidResponse = objResp;
          return next();
        }
        res.status(200).send(objResp);
      } else {
        const objResp = {
          status: "error",
          message: "documento a actualizar no encontrado",
          data: {},
        };
        res.status(400).send(objResp);
      }
    }
  } catch (err) {
    /// en aso de que ocurra algun error en la subida de los archivos   ############################################
    console.log(err);
    const objResp = {
      status: "error",
      data: err,
    };
    if (err.code == "LIMIT_FILE_SIZE") {
      objResp.message = "File size cannot be larger than 50MB!";
      return res.status(400).send(objResp);
    }
    objResp.message = `Could not upload the file. ${err}`;
    return res.status(400).send(objResp);
  }
};

//Remueve Docuemento
const uploadRemove = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const collection = req.originalUrl.match(re)[0];
  console.log("upload Remove... " + collection);
  try {
    const docSubcontratista = await MongoWraper.FindIDOne(
      req.params._id,
      collection,
      db
    ).catch((err) => {
      return null;
    });

    const newDocuments = docSubcontratista.documentos.filter((doc) => {
      if (doc.filename === req.body.filename) {
        /// en caso de que exista eliminar el registro no terornando nada y elimnando la foto
        console.log("eliminando documento:");
        console.log(doc);
        if (fs.existsSync(doc.filepath)) {
          console.log("si existe");
          fs.unlinkSync(doc.filepath);
        }
      } else return doc;
    });
    docSubcontratista.documentos = newDocuments;
    delete docSubcontratista._id;
    console.log(docSubcontratista);

    await MongoWraper.UpdateMongoBy_id(
      req.params._id,
      docSubcontratista,
      collection,
      db
    ).catch((err) => {
      const objResp = {
        status: "error",
        message: "db error",
        data: err,
      };
      res.status(400).send(objResp);
    });

    const objResp = {
      status: "ok",
      message: "completed",
      data: newDocuments,
    };
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }
    res.status(200).send(objResp);
  } catch (err) {
    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }
};
//probado
const distinct = (params) =>
  async function (req, res, next) {
    params = params ? params : {};
    const { Database, Collection, DistinctQuery, Middleware } = params;
    const collection = Collection ? Collection : req.originalUrl.match(re)[0];
    const db = Database ? Database : req.database;

    console.log(collection);
    console.log(db);
    try {
      const dbResponse = await MongoWraper.Distinct(
        DistinctQuery,
        collection,
        db
      );
      console.log(dbResponse);
      const objResp = {
        status: "ok",
        message: "completed",
        data: dbResponse == null ? {} : dbResponse,
      };
      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }
      res.status(200).send(objResp);
    } catch (err) {
      const objResp = {
        status: "error",
        message: "db error",
        data: err,
      };
      res.status(500).send(objResp);
    }
  };

const listFilter = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const db = req.database;
  /// CON paginado infinito
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit);
  console.log("path-------------------------");
  console.log(req.originalUrl);

  //   const collection = req.originalUrl.match(re)[0];
  console.log("collection-------------------------");
  console.log(collection);
  // seccion para solo traer los comps requeridos por el usuario
  var ProjectMongo = {};
  if (req.query.hasOwnProperty("projectMongo")) {
    if (Array.isArray(req.query.projectMongo)) {
      ProjectMongo = req.query.projectMongo.reduce((acum, e) => {
        return { ...acum, [e]: true };
      }, {});
    } else {
      ProjectMongo = { [req.query.projectMongo]: true };
    }
  }
  // seccion para concatenado

  const ConcatName = Object.keys(req.query)
    .filter((e) => e.includes("_concat"))
    .reduce((acum, e) => e.replace("_concat", ""), "");
  console.log(`nombre concatenado ${ConcatName}`);
  var ConcatMongo = null;
  if (ConcatName) {
    ConcatMongo = JSON.parse(req.query[ConcatName + "_concat"]);
  }
  //Seccion para ordenar todo segun lo requiera el usuario
  var SortMongoAsc = {};
  if (req.query.hasOwnProperty("sortMongoAsc")) {
    if (Array.isArray(req.query.sortMongoAsc)) {
      SortMongoAsc = req.query.sortMongoAsc.reduce((acum, e) => {
        return { ...acum, [e]: 1 };
      }, {});
    } else {
      SortMongoAsc = { [req.query.sortMongoAsc]: 1 };
    }
  }
  var SortMongoDec = {};
  if (req.query.hasOwnProperty("sortMongoDec")) {
    if (Array.isArray(req.query.sortMongoDec)) {
      SortMongoDec = req.query.sortMongoDec.reduce((acum, e) => {
        return { ...acum, [e]: -1 };
      }, {});
    } else {
      SortMongoDec = { [req.query.sortMongoDec]: -1 };
    }
  }
  var SortMongo = {};
  if (
    req.query.hasOwnProperty("sortMongoDec") ||
    req.query.hasOwnProperty("sortMongoAsc")
  ) {
    SortMongo = { ...SortMongoAsc, ...SortMongoDec };
  }
  console.log("Ordenamiento");
  console.log(SortMongo);

  const NeidQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_neid"))
    .map((e) => {
      return { Property: e.replace("ne", ""), Search: req.query[e] };
    });

  const NeidMongoQueries = NeidQueriesBuilder.map((e) =>
    GetGenericQueryNeid(e)
  );

  const NestringQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_nestring"))
    .map((e) => {
      return { Property: e.replace("_nestring", ""), Search: req.query[e] };
    });

  const NestringMongoQueries = NestringQueriesBuilder.map((e) =>
    GetGenericQueryNestring(e)
  );

  const StringQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_string"))
    .map((e) => {
      return { Property: e.replace("_string", ""), Search: req.query[e] };
    });

  const StringtMongoQueries = StringQueriesBuilder.map((e) =>
    GetGenericQueryString(e)
  );

  //after string
  const StringAfterQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_afterString"))
    .map((e) => {
      return { Property: e.replace("_afterString", ""), Search: req.query[e] };
    });

  const StringAftertMongoQueries = StringAfterQueriesBuilder.map((e) =>
    GetGenericQueryString(e)
  );

  const IntegerQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_integer"))
    .map((e) => {
      return {
        Property: e.replace("_integer", ""),
        Search: parseInt(req.query[e]),
      };
    });

  const IntegerMongoQueries = IntegerQueriesBuilder.map((e) =>
    GetGenericQueryString(e)
  );

  const IdQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_id"))
    .map((e) => {
      return { Property: e, Search: req.query[e] };
    });

  const IdMongoQueries = IdQueriesBuilder.map((e) => GetGenericQueryId(e));

  const BoolQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_boolean"))
    .map((e) => {
      return {
        Property: e.replace("_boolean", ""),
        Search: req.query[e],
      };
    });

  const BoolMongoQueries = BoolQueriesBuilder.map((e) =>
    GetGenericQueryBool(e)
  );

  // [{"$or":[{"proyectos_id":"61a795d36444930053e0c56d"},{"proyectos_id":"61a804ea67caea3647707d6b"}]}]
  // console.log(JSON.stringify(IdMongoQueries));

  const PartialQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_partial"))
    .map((e) => {
      return { Property: e.replace("_partial", ""), Search: req.query[e] };
    });

  const PartialMongoQueries = {
    $or: PartialQueriesBuilder.map((e) => GetGenericQueryPartial(e)),
  };

  //
  const PartialAfterQueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_afterPartial"))
    .map((e) => {
      return { Property: e.replace("_afterPartial", ""), Search: req.query[e] };
    });

  const PartialAfterMongoQueries = {
    $or: PartialAfterQueriesBuilder.map((e) => GetGenericQueryPartial(e)),
  };
  // {"$or":[{"$and":[{"empresa":{"$regex":"Pab","$options":"si"}},{"empresa":{"$regex":"li","$options":"si"}}]},{"$and":[{"ciudad":{"$regex":"ag","$options":"si"}}]}]}

  // const LookUpBuilder to check if its necesary to populate
  var LookUpBuilder = [];
  if (req.query.hasOwnProperty("lookup")) {
    if (Array.isArray(req.query.lookup)) {
      LookUpBuilder = req.query.lookup.map((e) => {
        return {
          $lookup: {
            from: e,
            localField: e + "_id",
            foreignField: "_id",
            as: e,
          },
        };
      });
    } else {
      LookUpBuilder = [
        {
          $lookup: {
            from: req.query.lookup,
            localField: req.query.lookup + "_id",
            foreignField: "_id",
            as: req.query.lookup,
          },
        },
      ];
    }
  }
  console.log(LookUpBuilder);

  const PropertyDateFilter = req.query.hasOwnProperty("propertydatefilter")
    ? req.query.propertydatefilter
    : "datetime";
  const QueryDate =
    req.query.hasOwnProperty("initialDate") &&
    req.query.hasOwnProperty("finalDate")
      ? [
          {
            [PropertyDateFilter]: {
              $gte: new Date(req.query.initialDate),
              $lt: new Date(req.query.finalDate),
            },
          },
        ]
      : [];

  const exampleQuerie = {
    $match: {
      ...(req.query.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted),
      ...(req.query.hasOwnProperty("showoculta") ? {} : Oculta),
      // ...(NeidMongoQueries.length > 0 && { $and: NeidMongoQueries }),
      ...(IdMongoQueries.length > 0 ||
      PartialQueriesBuilder.length > 0 ||
      BoolMongoQueries.length > 0 ||
      NeidMongoQueries.length > 0 ||
      NestringMongoQueries.length > 0 ||
      StringtMongoQueries.length > 0 ||
      IntegerMongoQueries.length > 0 ||
      QueryDate.length > 0
        ? {
            $and: [
              ...StringtMongoQueries,
              ...IntegerMongoQueries,
              ...BoolMongoQueries,
              ...IdMongoQueries,
              ...NeidMongoQueries,
              ...NestringMongoQueries,
              ...(PartialQueriesBuilder.length > 0
                ? [PartialMongoQueries]
                : []),
              ...QueryDate,
            ],
          }
        : {}),
    },
  };
  const exampleQuerieAfter = {
    $match: {
      // ...(NeidMongoQueries.length > 0 && { $and: NeidMongoQueries }),
      ...(PartialAfterQueriesBuilder.length > 0 ||
      StringAftertMongoQueries.length > 0
        ? {
            $and: [
              ...StringAftertMongoQueries,
              ...(PartialAfterQueriesBuilder.length > 0
                ? [PartialAfterMongoQueries]
                : []),
            ],
          }
        : {}),
    },
  };
  // console.log(JSON.stringify(exampleQuerie, null, 4));

  // $project: { "name" : { $concat : [ "$firstName", " ", "$lastName" ] } },
  const AggregationMongo = [
    ...(ConcatMongo
      ? [{ $addFields: { [ConcatName]: { $concat: ConcatMongo } } }]
      : []),
    exampleQuerie,
    ...LookUpBuilder,
    exampleQuerieAfter,
    ...(Object.keys(ProjectMongo).length > 0
      ? [{ $project: ProjectMongo }]
      : []),
    { $sort: Object.keys(SortMongo).length > 0 ? SortMongo : { _id: -1 } },
    ...(limit > 0
      ? [
          {
            $facet: {
              Total: [{ $count: "Total" }],
              Results: [
                { $skip: page > 0 ? page * limit : 0 },
                { $limit: limit },
              ],
              Metadata: [
                { $count: "Total" },
                {
                  $addFields: {
                    Page: page,
                    Limit: limit,
                  },
                },
                {
                  $addFields: {
                    // div: {
                    //   $divide: ["$Total", page == 0 ? limit * 1 : limit * page],
                    // },
                    Hasmore: {
                      $gt: [
                        {
                          $divide: ["$Total", limit * (page + 1)],
                        },
                        1,
                      ],
                    },
                  },
                },
              ],
            },
          },
        ]
      : []),
    // ...(limit > 0 ? [{ $unwind: { path: "$Metadata" } }] : []),
  ];
  console.log(JSON.stringify(AggregationMongo, null, 4));

  try {
    console.log(page);
    console.log(limit);
    console.log(collection);

    const dbResponse = await MongoWraper.AggregationMongo(
      AggregationMongo,
      collection,
      db
    );
    console.log(dbResponse);
    const objResp = {
      status: "ok",
      message: "completed",
      // data: dbResponse,
      data:
        limit > 0
          ? {
              ...dbResponse[0],
              Total:
                dbResponse[0].Total.length > 0
                  ? dbResponse[0].Total[0].Total
                  : 0,
              Metadata:
                dbResponse[0].Total.length > 0
                  ? dbResponse[0].Metadata[0]
                  : { Hasmore: false, Limit: limit, Page: page },
            }
          : dbResponse,
    };
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }
    res.status(200).send(objResp);
  } catch (err) {
    console.log(err);
    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(500).send(objResp);
  }
};

const pullIdFromArrayManagementDB = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  //   const db = "managementdb";
  //   const collection = req.body.Collection;

  const Query = { [req.body.Match.Name]: ObjectId(req.body.Match.Value) };
  const ItemsToRemove = {
    [req.body.ItemsToRemove.Name]: {
      $in: req.body.ItemsToRemove.Values.map((e) => ObjectId(e)),
    },
  };
  const Result = await MongoWraper.UpdateMongoManyPull(
    Query,
    ItemsToRemove,
    collection,
    db
  );
  const objResp = {
    status: "ok",
    message: "completed",
    data: Result,
  };
  if (Middleware) {
    req.MidResponse = objResp;
    return next();
  }
  res.status(200).send(objResp);
};

module.exports = (mongoWraperEasyClient) => {
  MongoWraper = mongoWraperEasyClient;
  // const MongoWraper = require("mongoclienteasywrapper")(url);

  return {
    pullIdFromArrayManagementDB: pullIdFromArrayManagementDB,
    listFilter: listFilter,
    uploadRemove: uploadRemove,
    uploadPatch: uploadPatch,
    uploadAdd: uploadAdd,
    fileUpload: fileUpload,
    docRemove: docRemove,
    docUpload: docUpload,
    distinct: distinct,
    remove: remove,
    updatePatch: updatePatch,
    updatePatchMany: updatePatchMany,
    create: create,
    listOne: listOne,
    list: list,
  };
};
