const listFilter2 = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;
  //   const db = req.database;
  if (req.method == "POST") {
    req.query = req.body;
  }
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

  const GTMongoQueries = QueryGenericComparisonGenerator(req, "gt");
  const GTEMongoQueries = QueryGenericComparisonGenerator(req, "gte");
  const LTMongoQueries = QueryGenericComparisonGenerator(req, "lt");
  const LTEMongoQueries = QueryGenericComparisonGenerator(req, "lte");

  const GTDateMongoQueries = QueryGenericComparisonGeneratorDate(req, "gt");
  const GTEDateMongoQueries = QueryGenericComparisonGeneratorDate(req, "gte");
  const LTDateMongoQueries = QueryGenericComparisonGeneratorDate(req, "lt");
  // console.log(LTDateMongoQueries[0])
  const LTEDateMongoQueries = QueryGenericComparisonGeneratorDate(req, "lte");

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
  //esta es la diferencia del list filter 1
  const LookUpBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_lookup"))
    .reduce((acum, e) => {
      if (Array.isArray(req.query[e])) {
        const ArrLookup = req.query[e].map((property) => {
          return {
            $lookup: {
              from: e.replace("_lookup", ""),
              localField: property,
              foreignField: "_id",
              as: e.replace("_lookup", "") + property,
            },
          };
        });
        return [...acum, ...ArrLookup];
      }
      return [
        ...acum,
        {
          $lookup: {
            from: e.replace("_lookup", ""),
            localField: req.query[e],
            foreignField: "_id",
            as: e.replace("_lookup", "") + req.query[e],
          },
        },
      ];
    }, []);

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
      GTDateMongoQueries.length > 0 ||
      GTEDateMongoQueries.length > 0 ||
      LTDateMongoQueries.length > 0 ||
      LTEDateMongoQueries.length > 0 ||
      GTMongoQueries.length > 0 ||
      GTEMongoQueries.length > 0 ||
      LTMongoQueries.length > 0 ||
      LTEMongoQueries.length > 0 ||
      QueryDate.length > 0
        ? {
            $and: [
              ...StringtMongoQueries,
              ...IntegerMongoQueries,
              ...GTMongoQueries,
              ...GTEMongoQueries,
              ...LTMongoQueries,
              ...LTEMongoQueries,
              ...LTDateMongoQueries,
              ...LTEDateMongoQueries,
              ...GTDateMongoQueries,
              ...GTEDateMongoQueries,
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
exports.listFilter2 = listFilter2;
