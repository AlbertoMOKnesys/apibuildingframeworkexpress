// index.js
const fs = require("fs");
const ObjectId = require("mongodb").ObjectId;

const { sizeObj } = require("./common");
const uploadfileDatos = require("./uploadFileData");
const uploadfileDatosNew = require("./uploadFileDataNew");
const { ApiErrorData } = require("./ApiError");

// Query builder helpers
const {
  buildProjection,
  buildConcatenation,
  buildSortConfig,
  buildAllFilters,
  buildLookupStages,
  buildLookupStagesExtended,
  buildDateRangeQuery,
  buildAfterMatchStage,
  buildFacetStage,
  formatPaginatedResponse,
  hasActiveFilters,
  hasActiveFiltersExtended,
  buildComparisonFilters,
} = require("./helpers/queryBuilders");

const re = /[a-zA-Z0-9_-]+/;
const operatorNotDeleted = { status: { $ne: "deleted" } };
const Oculta = { oculta: { $ne: true } };

// Validations
const {
  validateSchemaExpress,
} = require("./middlewares/schemaValidatorExpress");
const { validateSchemaYup } = require("./middlewares/schemaValidatorYup");

const Assign = async (body, db0, db1) => {
  const collection = Object.keys(body);
  console.log(collection);
  //   {
  //     "asistencias": ["61f801cdb6153a0034c123ec"]
  //      collection:[id]
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
    db0,
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
    db1,
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
    db0,
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
    db1,
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
      db,
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
          }),
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

const GetGenericComparisonQuery = (Query, operator) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.reduce((acum, ArrSearch) => {
      const QuerySpecific = [{ [Query.Property]: { [operator]: ArrSearch } }];
      return [...acum, ...QuerySpecific];
    }, []);
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return QueriesArrProp;
  } else {
    const QuerySpecific = { [Query.Property]: { [operator]: Query.Search } };
    return QuerySpecific;
  }
};

const GetDateComparisonQuery = (Query, operator) => {
  // const ReqQuery = { Search: req.query.ObrasId };
  // console.log(Query.Search)
  if (Array.isArray(Query.Search)) {
    const QueriesArrProp = Query.Search.reduce((acum, ArrSearch) => {
      const QuerySpecific = [
        { [Query.Property]: { [operator]: new Date(ArrSearch) } },
      ];
      return [...acum, ...QuerySpecific];
    }, []);
    //console.log(QueriesArrProp);

    //[{ $or: [...QueriesArrProp] }];
    return QueriesArrProp;
  } else {
    // console.log("queryy",Query.Search)
    const QuerySpecific = {
      [Query.Property]: { [operator]: new Date(Query.Search) },
    };
    return QuerySpecific;
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

// -------- Refactored methods --------------------

/**
 * Creates a new document in the specified MongoDB collection.
 *
 * Handles file uploads, collection assignments, and supports middleware chaining.
 * Files are moved from temp directory to a permanent location based on document ID.
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {string} [params.PathBaseFile] - Base path for file storage
 * @param {string} [params.URL] - Base URL for file access
 * @param {string} [params.ApiErrorFailDb] - Custom error message for DB failures
 * @param {Function} [params.AsyncFunctionAfter] - Callback executed after document creation
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.post('/users', apiBuilder.create());
 *
 * @example
 * // With custom database and after callback
 * app.post('/users', apiBuilder.create({
 *   Database: 'customDb',
 *   AsyncFunctionAfter: async (req, res, dbResponse) => {
 *     await sendEmail(dbResponse.insertedId);
 *   }
 * }));
 */
const create = (params) => async (req, res, next) => {
  params = params || {};
  const {
    Database,
    Collection,
    PathBaseFile,
    URL,
    ApiErrorFailDb,
    AsyncFunctionAfter,
    Middleware,
  } = params;

  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  try {
    // Extract assignments without mutating req.body
    const { _Assign, ...bodyData } = req.body;
    const asignaciones = _Assign || [];

    // Object to save
    const objToSave = {
      ...bodyData,
      datetime: new Date(),
    };
    // DEBUG: console.log(objToSave);

    // Insert into DB
    const dbResponse = await MongoWraper.SavetoMongo(objToSave, collection, db);

    // Process assignments
    if (asignaciones.length > 0) {
      const asignacionesConId = asignaciones.map((e) => ({
        ...e,
        [collection]: [dbResponse.insertedId],
      }));

      const promisesAssign = asignacionesConId.map((e) => Assign(e, db, db));
      await Promise.allSettled(promisesAssign); // Changed to allSettled to avoid failing if one assignment fails
    }

    // Handle file upload if present in request
    if (req.files?.file?.[0]) {
      // Build destination path: /{basePath}/{db}/{collection}/{documentId}/
      const dirDestino = `${PathBaseFile}/${db}/${collection}/${dbResponse.insertedId}/`;

      // Create directory structure if it doesn't exist
      if (!fs.existsSync(dirDestino)) {
        await fs.promises.mkdir(dirDestino, { recursive: true });
      }

      const fotofile = req.files.file[0];
      const pathDestino = dirDestino + fotofile.filename;

      // Move file from temp to permanent location
      await fs.promises.rename(fotofile.path, pathDestino);

      // Build public URL for file access
      const foto = `${URL}/${db}/${collection}/${dbResponse.insertedId}/${fotofile.filename}`;

      // Update document with photo info
      await MongoWraper.UpdateMongoBy_id(
        dbResponse.insertedId,
        {
          foto,
          fotopath: pathDestino,
        },
        collection,
        db,
      );

      // Backwards compatibility
      req.body.foto = foto;
      req.body.fotopath = pathDestino;
    }

    // Fetch the complete document after all updates
    const dbResponseFind = await MongoWraper.FindOne(
      dbResponse.insertedId,
      collection,
      db,
    );

    // Execute after function if exists
    if (AsyncFunctionAfter) {
      await AsyncFunctionAfter(req, res, dbResponse);
    }

    // Prepare response
    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponseFind,
      extra: req.extraresponse,
    };

    // If middleware, pass to next
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    // Send response
    res.status(200).send(objResp);
  } catch (err) {
    console.error("Error in create:", err);
    throw new ApiErrorData(400, ApiErrorFailDb || "db error", err);
  }
};

/**
 * Retrieves distinct values for a specified field in a collection.
 *
 * Useful for getting unique values like categories, statuses, tags, etc.
 * Returns an array of unique values for the specified field.
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {string} params.DistinctQuery - Field name to get distinct values from
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Get all unique status values
 * app.get('/users/statuses', apiBuilder.distinct({
 *   DistinctQuery: 'status'
 * }));
 * // Returns: { status: "ok", data: ["active", "inactive", "pending"] }
 *
 * @example
 * // Get all unique categories from a specific collection
 * app.get('/products/categories', apiBuilder.distinct({
 *   Collection: 'products',
 *   DistinctQuery: 'category'
 * }));
 *
 * @example
 * // As middleware to transform response
 * app.get('/tags/unique',
 *   apiBuilder.distinct({ DistinctQuery: 'tag', Middleware: true }),
 *   (req, res) => {
 *     const tags = req.MidResponse.data;
 *     res.json({ tags: tags.sort() });
 *   }
 * );
 */
const distinct = (params) => async (req, res, next) => {
  params = params || {};
  const { Database, Collection, DistinctQuery, Middleware } = params;

  // Resolve collection and database from params or request context
  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  // DEBUG: console.log("collection:", collection);
  // DEBUG: console.log("db:", db);

  try {
    // Get distinct values for the specified field
    const dbResponse = await MongoWraper.Distinct(
      DistinctQuery,
      collection,
      db,
    );

    // DEBUG: console.log("Distinct values:", dbResponse);

    // Build standard response object
    // Returns empty object if no distinct values found
    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponse ?? {},
    };

    // Middleware mode: attach response to request and continue chain
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    res.status(200).send(objResp);
  } catch (err) {
    // Log error for debugging purposes
    console.error("Error in distinct:", err);

    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(500).send(objResp);
  }
};

/**
 * Lists documents from a collection with optional filtering, pagination, and date range.
 *
 * Supports two modes:
 * - With query params: Returns paginated results with text search filters
 * - Without query params: Returns all documents with automatic population
 *
 * Automatically excludes soft-deleted documents (status: "deleted") and hidden
 * documents (oculta: true) unless explicitly requested via showdeleted/showoculta params.
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage - returns all documents
 * app.get('/users', apiBuilder.list());
 *
 * @example
 * // With pagination
 * // GET /users?page=0&limit=10
 *
 * @example
 * // With text search (searches with regex)
 * // GET /users?name=john&email=gmail
 *
 * @example
 * // With date range filter (filters by document creation date via ObjectId)
 * // GET /users?initialDate=2024-01-01&finalDate=2024-12-31
 *
 * @example
 * // Include soft-deleted or hidden documents
 * // GET /users?showdeleted=true&showoculta=true
 */
const list = (params) => async (req, res, next) => {
  params = params || {};
  const { Database, Collection, Middleware } = params;

  // Resolve collection and database from params or request context
  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  // DEBUG: console.log("collection", collection);

  // Check if user has custom ordering preferences for this collection
  // Used to track "last used" items for UI sorting purposes
  const hasOrder = req.user?.order?.[collection] || {};
  // DEBUG: console.log("hasOrder:", hasOrder);

  // Preserve original query to check for showdeleted/showoculta flags
  const queryFull = { ...req.query };

  // Remove special flags from query before processing filters
  // These flags control visibility, not filtering
  delete req.query.showdeleted;
  delete req.query.showoculta;

  const sizeQuery = sizeObj(req.query);

  /**
   * Adds lastUse timestamp to each document based on user's ordering preferences.
   * Used by frontend to sort recently used items first.
   * @param {Array} documents - Array of MongoDB documents
   * @returns {Array} Documents with lastUse field added
   */
  const addLastUseToDocuments = (documents) => {
    return documents.map((doc) => ({
      ...doc,
      lastUse: hasOrder[doc._id] ?? 0,
    }));
  };

  /**
   * Builds the base query with soft delete and hidden document filters.
   * @returns {Object} MongoDB query object
   */
  const buildBaseQuery = () => ({
    $and: [
      queryFull.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted,
      queryFull.hasOwnProperty("showoculta") ? {} : Oculta,
    ],
  });

  try {
    // Branch: With query parameters (filtered/paginated results)
    if (sizeQuery > 0) {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit);

      // Build text search filters from query params
      // Each param becomes a regex search: ?name=john -> { name: { $regex: "john", $options: "si" } }
      const andArr = CreateAndArr(req);
      const fullAndArray = andArr.reduce((acum, arr) => [...acum, ...arr], []);

      // Construct MongoDB query with all filters
      const query = {
        $and: [
          ...fullAndArray,
          queryFull.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted,
          queryFull.hasOwnProperty("showoculta") ? {} : Oculta,
        ],
      };

      // DEBUG: console.log("Query with filters:", query);

      // Add date range filter if provided
      // Uses ObjectId timestamp extraction for filtering by creation date
      if (req.query.initialDate || req.query.finalDate) {
        query.$and.push({
          _id: {
            $gte: objectIdWithTimestamp(req.query.initialDate),
            $lt: objectIdWithTimestamp(req.query.finalDate),
          },
        });
      }

      // If query only has empty objects in $and, use empty query instead
      // This handles the case where no actual filters were provided
      const emptyQuery = { $and: [] };
      const finalQuery =
        JSON.stringify(emptyQuery) === JSON.stringify(query) ? {} : query;

      // DEBUG: console.log("Final query:", JSON.stringify(finalQuery));

      // Execute paginated query
      const dbResponse = await MongoWraper.FindPaginated(
        finalQuery,
        page,
        limit,
        collection,
        db,
      );

      // Add lastUse field for UI sorting
      const data = addLastUseToDocuments(dbResponse);

      const objResp = {
        status: "ok",
        message: "completed",
        rows: data.length,
        data,
      };

      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }

      res.status(200).send(objResp);
    } else {
      // Branch: Without query parameters (return all with population)
      const query = buildBaseQuery();

      // Fetch all documents with automatic population of references
      const dbResponse = await MongoWraper.PopulateAuto(query, collection, db);

      // Add lastUse field for UI sorting
      const data = addLastUseToDocuments(dbResponse);

      const objResp = {
        status: "ok",
        message: "completed",
        rows: data.length,
        data,
      };

      if (Middleware) {
        req.MidResponse = objResp;
        return next();
      }

      res.status(200).send(objResp);
    }
  } catch (err) {
    // Log error for debugging purposes
    console.error("Error in list:", err);

    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }
};

/**
 * Advanced filtered list with aggregation pipeline support.
 *
 * Provides powerful querying capabilities including:
 * - Multiple filter types (_id, _string, _partial, _boolean, _neid, _nestring, _integer)
 * - Date range filtering
 * - Field projection (select specific fields)
 * - Sorting (ascending/descending)
 * - Lookups/population of related collections
 * - Field concatenation
 * - Pagination with metadata (total count, hasMore flag)
 *
 * Supports both GET (query params) and POST (body) requests.
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.get('/users/filter', apiBuilder.listFilter());
 *
 * @example
 * // Filter by ObjectId
 * // GET /users/filter?roles_id=507f1f77bcf86cd799439011
 *
 * @example
 * // Partial text search (regex)
 * // GET /users/filter?name_partial=john
 *
 * @example
 * // Exact string match
 * // GET /users/filter?status_string=active
 *
 * @example
 * // Boolean filter
 * // GET /users/filter?isAdmin_boolean=true
 *
 * @example
 * // Not equal filters
 * // GET /users/filter?role_neid=507f1f77bcf86cd799439011
 * // GET /users/filter?status_nestring=deleted
 *
 * @example
 * // Pagination with sorting
 * // GET /users/filter?page=0&limit=10&sortMongoDec=createdAt
 *
 * @example
 * // Field projection (only return specific fields)
 * // GET /users/filter?projectMongo=name&projectMongo=email
 *
 * @example
 * // Lookup/populate related collection
 * // GET /users/filter?lookup=roles
 *
 * @example
 * // Date range filter
 * // GET /users/filter?initialDate=2024-01-01&finalDate=2024-12-31&propertydatefilter=createdAt
 */
const listFilter = (params) => async (req, res, next) => {
  params = params || {};
  const { Database, Collection, Middleware } = params;

  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  // Support both GET (query params) and POST (body) requests
  if (req.method === "POST") {
    req.query = req.body;
  }

  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit);

  // Use helper functions
  const projectMongo = buildProjection(req.query);
  const { concatName, concatMongo } = buildConcatenation(req.query);
  const sortMongo = buildSortConfig(req.query);

  // Pass query functions as dependency injection
  const queryFunctions = {
    GetGenericQueryId,
    GetGenericQueryString,
    GetGenericQueryBool,
    GetGenericQueryNeid,
    GetGenericQueryNestring,
    GetGenericQueryPartial,
  };

  const filters = buildAllFilters(req.query, queryFunctions);
  const lookupBuilder = buildLookupStages(req.query);
  const propertyDateFilter = req.query.propertydatefilter || "datetime";
  const queryDate = buildDateRangeQuery(req.query, propertyDateFilter);
  const afterMatch = buildAfterMatchStage(req.query, queryFunctions);

  // Check if any filters are active
  const hasFilters = hasActiveFilters(filters, queryDate);

  // Build main $match stage
  const mainMatch = {
    $match: {
      ...(req.query.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted),
      ...(req.query.hasOwnProperty("showoculta") ? {} : Oculta),
      ...(hasFilters
        ? {
            $and: [
              ...filters.stringQueries,
              ...filters.integerQueries,
              ...filters.boolQueries,
              ...filters.idQueries,
              ...filters.neidQueries,
              ...filters.nestringQueries,
              ...(filters.partialBuilders.length > 0
                ? [
                    {
                      $or: filters.partialBuilders.map((e) =>
                        GetGenericQueryPartial(e),
                      ),
                    },
                  ]
                : []),
              ...queryDate,
            ],
          }
        : {}),
    },
  };

  // Build aggregation pipeline
  const aggregationPipeline = [
    ...(concatMongo
      ? [{ $addFields: { [concatName]: { $concat: concatMongo } } }]
      : []),
    mainMatch,
    ...lookupBuilder,
    afterMatch,
    ...(Object.keys(projectMongo).length > 0
      ? [{ $project: projectMongo }]
      : []),
    { $sort: Object.keys(sortMongo).length > 0 ? sortMongo : { _id: -1 } },
    ...(limit > 0 ? [buildFacetStage(page, limit)] : []),
  ];

  try {
    const dbResponse = await MongoWraper.AggregationMongo(
      aggregationPipeline,
      collection,
      db,
    );

    const objResp = {
      status: "ok",
      message: "completed",
      data: formatPaginatedResponse(dbResponse, limit, page),
    };

    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    res.status(200).send(objResp);
  } catch (err) {
    console.error("Error in listFilter:", err);

    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(500).send(objResp);
  }
};

/**
 * Advanced filtered list with extended comparison operators and flexible lookups.
 *
 * Extends listFilter with:
 * - Integer comparison operators (_igt, _igte, _ilt, _ilte)
 * - Date comparison operators (_dgt, _dgte, _dlt, _dlte)
 * - Flexible lookup configuration (specify which field to use for join)
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.get('/users/filter2', apiBuilder.listFilter2());
 *
 * @example
 * // Integer comparisons
 * // GET /users/filter2?age_igtei=18      -> age > 18
 * // GET /users/filter2?age_igtei=18      -> age >= 18
 * // GET /users/filter2?age_ilti=65       -> age < 65
 * // GET /users/filter2?age_iltei=65      -> age <= 65
 *
 * @example
 * // Date comparisons
 * // GET /users/filter2?createdAt_dgtd=2024-01-01    -> createdAt > date
 * // GET /users/filter2?createdAt_dgted=2024-01-01   -> createdAt >= date
 * // GET /users/filter2?createdAt_dltd=2024-12-31   -> createdAt < date
 * // GET /users/filter2?createdAt_dlted=2024-12-31  -> createdAt <= date
 *
 * @example
 * // Flexible lookup (specify which field to join on)
 * // GET /users/filter2?roles_lookup=assignedRole_id
 * // Joins roles collection using assignedRole_id field instead of default roles_id
 */
const listFilter2 = (params) => async (req, res, next) => {
  params = params || {};
  const { Database, Collection, Middleware } = params;

  // Resolve collection and database from params or request context
  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  // Support both GET (query params) and POST (body) requests
  if (req.method === "POST") {
    req.query = req.body;
  }

  // DEBUG: console.log("path:", req.originalUrl);
  // DEBUG: console.log("collection:", collection);

  // Extract pagination params
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit);

  // Use helper functions for common operations
  const projectMongo = buildProjection(req.query);
  const { concatName, concatMongo } = buildConcatenation(req.query);
  const sortMongo = buildSortConfig(req.query);
  // DEBUG: console.log("Sort config:", sortMongo);

  // Pass query functions as dependency injection
  const queryFunctions = {
    GetGenericQueryId,
    GetGenericQueryString,
    GetGenericQueryBool,
    GetGenericQueryNeid,
    GetGenericQueryNestring,
    GetGenericQueryPartial,
  };

  // Pass comparison functions as dependency injection
  const comparisonFunctions = {
    GetGenericComparisonQuery,
    GetDateComparisonQuery,
  };

  // Build all filter queries from request params
  const filters = buildAllFilters(req.query, queryFunctions);

  // Build comparison filters (integers and dates)
  // This is the main difference from listFilter
  const comparisonFilters = buildComparisonFilters(
    req.query,
    comparisonFunctions,
  );

  // Use extended lookup builder that allows specifying the join field
  // Example: ?roles_lookup=customField_id joins on customField_id instead of roles_id
  const lookupBuilder = buildLookupStagesExtended(req.query);

  // Build date range filter if provided
  const propertyDateFilter = req.query.propertydatefilter || "datetime";
  const queryDate = buildDateRangeQuery(req.query, propertyDateFilter);

  // Build post-lookup filters
  const afterMatch = buildAfterMatchStage(req.query, queryFunctions);

  // Check if any filters are active (including comparison filters)
  const hasFilters = hasActiveFiltersExtended(
    filters,
    comparisonFilters,
    queryDate,
  );

  // Build main $match stage with all filters including comparisons
  const mainMatch = {
    $match: {
      // Exclude soft-deleted documents unless showdeleted is set
      ...(req.query.hasOwnProperty("showdeleted") ? {} : operatorNotDeleted),
      // Exclude hidden documents unless showoculta is set
      ...(req.query.hasOwnProperty("showoculta") ? {} : Oculta),
      // Add all filters if any exist
      ...(hasFilters
        ? {
            $and: [
              // Basic filters
              ...filters.stringQueries,
              ...filters.integerQueries,
              ...filters.boolQueries,
              ...filters.idQueries,
              ...filters.neidQueries,
              ...filters.nestringQueries,
              // Integer comparison filters
              ...comparisonFilters.gtQueries,
              ...comparisonFilters.gteQueries,
              ...comparisonFilters.ltQueries,
              ...comparisonFilters.lteQueries,
              // Date comparison filters
              ...comparisonFilters.gtDateQueries,
              ...comparisonFilters.gteDateQueries,
              ...comparisonFilters.ltDateQueries,
              ...comparisonFilters.lteDateQueries,
              // Partial/regex match filters
              ...(filters.partialBuilders.length > 0
                ? [
                    {
                      $or: filters.partialBuilders.map((e) =>
                        GetGenericQueryPartial(e),
                      ),
                    },
                  ]
                : []),
              // Date range filter
              ...queryDate,
            ],
          }
        : {}),
    },
  };

  // Construct the complete aggregation pipeline
  const aggregationPipeline = [
    // Add computed concatenated fields if configured
    ...(concatMongo
      ? [{ $addFields: { [concatName]: { $concat: concatMongo } } }]
      : []),
    // Main filter stage
    mainMatch,
    // Lookup stages for population (using extended builder)
    ...lookupBuilder,
    // Post-lookup filter stage
    afterMatch,
    // Field projection if configured
    ...(Object.keys(projectMongo).length > 0
      ? [{ $project: projectMongo }]
      : []),
    // Sorting (defaults to newest first by _id)
    { $sort: Object.keys(sortMongo).length > 0 ? sortMongo : { _id: -1 } },
    // Pagination with metadata (only if limit is set)
    ...(limit > 0 ? [buildFacetStage(page, limit)] : []),
  ];

  // DEBUG: console.log("Aggregation pipeline:", JSON.stringify(aggregationPipeline, null, 2));

  try {
    // DEBUG: console.log("page:", page, "limit:", limit, "collection:", collection);

    const dbResponse = await MongoWraper.AggregationMongo(
      aggregationPipeline,
      collection,
      db,
    );

    // DEBUG: console.log("DB Response:", dbResponse);

    // Format response based on whether pagination was used
    const objResp = {
      status: "ok",
      message: "completed",
      data: formatPaginatedResponse(dbResponse, limit, page),
    };

    // Middleware mode: attach response to request and continue chain
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    res.status(200).send(objResp);
  } catch (err) {
    // Log error for debugging purposes
    console.error("Error in listFilter2:", err);

    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(500).send(objResp);
  }
};

/**
 * Retrieves a single document by its _id with automatic population of related documents.
 *
 * Uses ND_FindIDOnePopulated which populates all fields ending with "_id"
 * that reference other collections (e.g., user_id, roles_id).
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.get('/users/:_id', apiBuilder.listOne());
 *
 * @example
 * // With custom collection
 * app.get('/profile/:_id', apiBuilder.listOne({
 *   Collection: 'users'
 * }));
 *
 * @example
 * // As middleware to transform response
 * app.get('/users/:_id',
 *   apiBuilder.listOne({ Middleware: true }),
 *   (req, res) => {
 *     const user = req.MidResponse.data;
 *     res.json({ ...user, fullName: `${user.firstName} ${user.lastName}` });
 *   }
 * );
 */
const listOne = (params) => async (req, res, next) => {
  params = params || {};
  const { Database, Collection, Middleware } = params;

  // Resolve collection and database from params or request context
  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  try {
    // Fetch document by _id with automatic population of referenced documents
    // ND = "Not Deleted" - excludes documents with status: "deleted"
    const dbResponse = await MongoWraper.ND_FindIDOnePopulated(
      req.params._id,
      collection,
      db,
    );

    // Build standard response object
    // Returns empty object if document not found (instead of null)
    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponse ?? {}, // Returns {} ONLY if dbResponse is null or undefined
    };

    // Middleware mode: attach response to request and continue chain
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    res.status(200).send(objResp);
  } catch (err) {
    // Log error for debugging purposes
    console.error("Error in listOne:", err);

    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }
};

/**
 * Performs a soft delete on a document by setting its status to "deleted".
 *
 * Supports cascading soft deletes to related collections via _RecursiveDelete
 * and removing references from other collections via _Unassign.
 * The document is not physically removed from the database.
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {string} [params.PathBaseFile] - Base path for file storage (unused but kept for consistency)
 * @param {string} [params.URL] - Base URL for file access (unused but kept for consistency)
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage - just soft deletes the document
 * app.delete('/users/:_id', apiBuilder.remove());
 *
 * @example
 * // With recursive delete and unassign in request body
 * // DELETE /users/123
 * // {
 * //   "_RecursiveDelete": ["posts", "comments"],  // Soft delete related documents
 * //   "_Unassign": ["roles", "teams"]             // Remove user reference from these collections
 * // }
 */
const remove = (params) => async (req, res, next) => {
  params = params || {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;

  // Resolve collection and database from params or request context
  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  try {
    // Extract special fields for cascade operations without mutating req.body
    // _RecursiveDelete: array of collection names to cascade soft delete
    // _Unassign: array of collection names to remove references from
    const { _Unassign, _RecursiveDelete } = req.body || {};
    const desasignaciones = _Unassign || [];
    const recursiveDelete = _RecursiveDelete || [];

    // Perform soft delete (sets status: "deleted" on the document)
    // Document remains in DB but won't appear in normal queries
    const dbResponse = await MongoWraper.ND_DeleteMongoby_id(
      req.params._id,
      collection,
      db,
    );

    // Process recursive deletes in related collections
    if (recursiveDelete.length > 0) {
      const promisesRecursiveDelete = recursiveDelete.map((collectionDelete) =>
        MongoWraper.UpdateMongoMany(
          { [collection + "_id"]: req.params._id },
          { status: "deleted" },
          collectionDelete,
          db,
        ),
      );

      // Using allSettled to prevent one failed delete from breaking others
      await Promise.allSettled(promisesRecursiveDelete);
    }

    // Process unassignments
    if (desasignaciones.length > 0) {
      const promisesUnAssign = desasignaciones.map((collectionDelete) =>
        UnAssignIdToCollections(
          collectionDelete,
          collection,
          req.params._id,
          db,
        ),
      );

      // Using allSettled to prevent one failed unassign from breaking others
      await Promise.allSettled(promisesUnAssign);
    }

    // Build standard response object
    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponse,
    };

    // If middleware, pass to next
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    // Send response
    res.status(200).send(objResp);
  } catch (err) {
    console.error("Error in remove:", err);

    // Handle error properly
    const objResp = {
      status: "error",
      message: "db error",
      data: err,
    };
    res.status(400).send(objResp);
  }
};

/**
 * Updates an existing document in the specified MongoDB collection using PATCH semantics.
 *
 * Supports partial updates, file uploads, and bidirectional relationship management
 * through _Assign and _UnAssign special fields.
 *
 * @param {Object} params - Configuration options
 * @param {string} [params.Database] - Database name (defaults to req.database)
 * @param {string} [params.Collection] - Collection name (defaults to URL path)
 * @param {string} [params.PathBaseFile] - Base path for file storage
 * @param {string} [params.URL] - Base URL for file access
 * @param {string} [params.ApiErrorFailDb] - Custom error message for DB failures
 * @param {Function} [params.AsyncFunctionAfter] - Callback executed after document update
 * @param {boolean} [params.Middleware] - If true, passes response to next() instead of sending
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.patch('/users/:_id', apiBuilder.updatePatch());
 *
 * @example
 * // With assignments and unassignments in request body
 * // PATCH /users/123
 * // {
 * //   "name": "John",
 * //   "_Assign": [{ "roles": ["roleId1", "roleId2"] }],
 * //   "_UnAssign": [{ "roles": ["oldRoleId"] }]
 * // }
 */
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

  // Resolve collection and database from params or request context
  const collection = Collection || req.originalUrl.match(re)[0];
  const db = Database || req.database;

  try {
    // Extract special fields for relationship management without mutating req.body
    // _Assign: creates new relationships between collections
    // _UnAssign: removes existing relationships between collections
    const { _Assign, _UnAssign, ...bodyData } = req.body;
    const asignaciones = _Assign || [];
    const desasignaciones = _UnAssign || [];

    // Update document with provided fields (partial update)
    const dbResponse = await MongoWraper.UpdateMongoBy_id(
      req.params._id,
      bodyData,
      collection,
      db,
    );

    // Process new assignments (add references to related collections)
    // Example: assigning new roles to a user
    if (asignaciones.length > 0) {
      const asignacionesConId = asignaciones.map((e) => ({
        ...e,
        [collection]: [req.params._id],
      }));

      const promisesAssign = asignacionesConId.map((e) => Assign(e, db, db));
      await Promise.allSettled(promisesAssign);
    }

    // Process unassignments (remove references from related collections)
    // Example: removing roles from a user
    if (desasignaciones.length > 0) {
      const desasignacionesConId = desasignaciones.map((e) => ({
        ...e,
        [collection]: [req.params._id],
      }));

      const promisesUnAssign = desasignacionesConId.map((e) =>
        UnAssign(e, db, db),
      );
      await Promise.allSettled(promisesUnAssign);
    }

    // Execute custom callback if provided (e.g., invalidate cache, send notifications)
    if (AsyncFunctionAfter) {
      await AsyncFunctionAfter(req, res, dbResponse);
    }

    // Handle file upload if present in request
    if (req.files?.file?.[0]) {
      // Build destination path: /{basePath}/{db}/{collection}/{documentId}/
      const dirDestino = `${PathBaseFile}/${db}/${collection}/${req.params._id}/`;

      // Create directory structure if it doesn't exist
      if (!fs.existsSync(dirDestino)) {
        await fs.promises.mkdir(dirDestino, { recursive: true });
      }

      const fotofile = req.files.file[0];
      const pathDestino = dirDestino + fotofile.filename;

      // Move file from temp to permanent location
      await fs.promises.rename(fotofile.path, pathDestino);

      // Build public URL for file access
      const foto = `${URL}/${db}/${collection}/${req.params._id}/${fotofile.filename}`;

      // Update document with new file references
      await MongoWraper.UpdateMongoBy_id(
        req.params._id,
        {
          foto,
          fotopath: pathDestino,
        },
        collection,
        db,
      );
    }

    // Build standard response object
    const objResp = {
      status: "ok",
      message: "completed",
      data: dbResponse,
    };

    // Middleware mode: attach response to request and continue chain
    if (Middleware) {
      req.MidResponse = objResp;
      return next();
    }

    res.status(200).send(objResp);
  } catch (err) {
    // Log error for debugging purposes
    console.error("Error in updatePatch:", err);

    // Throw ApiError to be handled by error middleware
    throw new ApiErrorData(400, ApiErrorFailDb || "db error", err);
  }
};

// -------- methods without clean code refactor, to be refactored later --------------
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
      err,
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
      db,
    );

    req.body.foto = foto;
    req.body.fotopath = pathDestino;
  }

  const dbResponseFind = await MongoWraper.FindOne(
    dbResponse.insertedId,
    collection,
    db,
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
      db,
    );
  } catch (err) {
    console.log(err);

    throw new ApiErrorData(
      400,
      ApiErrorFailDb ? ApiErrorFailDb : "db error",
      err,
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

// Agrega icono
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
        db,
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
        req.database,
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

// Remueve icono
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
        db,
      );

      const lastFind = await MongoWraper.FindIDOne(
        req.params._id,
        collection,
        db,
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

const removePropertyId = (params) => async (req, res, next) => {
  params = params ? params : {};
  const { Database, Collection, PathBaseFile, URL, Middleware } = params;
  const collection = Collection ? Collection : req.originalUrl.match(re)[0];
  const db = Database ? Database : req.database;

  const data = await MongoWraper.UpdateMongoBy_idRemoveProperty(
    req.params._id,
    req.body.propertyToRemove,
    collection,
    db,
  );
  const objResp = {
    status: "ok",
    message: "completed",
    data: data,
  };
  if (Middleware) {
    req.MidResponse = objResp;
    return next();
  }
  res.status(200).send(objResp);
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
      db,
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
      BodyParsed,
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
      db,
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
      db,
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
  bodyParsed,
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

// Agrega Documento
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
      db,
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
        db,
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
        db,
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

// Actualiza Documento
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
      db,
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
        carga.filename === body.filename ? carga : null,
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
          carga.filename === body.filename ? body : carga,
        );
        docSubcontratista.documentos = cargas;

        /// actualizar nuevos datos de rek y la nueva carpeta de trabajadores    ############################################
        await MongoWraper.UpdateMongoBy_id(
          req.params._id,
          docSubcontratista,
          collection,
          db,
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

// Remueve Documento
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
      db,
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
      db,
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

const QueryGenericComparisonGenerator = (req, operator) => {
  const QueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_i" + operator + "i"))
    .map((e) => {
      return {
        Property: e.replace("_i" + operator + "i", ""),
        Search: parseInt(req.query[e]),
      };
    });
  return QueriesBuilder.map((e) =>
    GetGenericComparisonQuery(e, "$" + operator),
  );
};

const QueryGenericComparisonGeneratorDate = (req, operator) => {
  const QueriesBuilder = Object.keys(req.query)
    .filter((e) => e.includes("_d" + operator + "d"))
    .map((e) => {
      return {
        Property: e.replace("_d" + operator + "d", ""),
        Search: req.query[e],
      };
    });
  console.log("req", req.query);
  return QueriesBuilder.map((e) => GetDateComparisonQuery(e, "$" + operator));
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
    db,
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
    create: create,
    distinct: distinct,
    docRemove: docRemove,
    docUpload: docUpload,
    fileUpload: fileUpload,
    list: list,
    listFilter: listFilter,
    listFilter2: listFilter2,
    listOne: listOne,
    Middlewares: {
      validateSchemaExpress,
      validateSchemaYup,
    },
    pullIdFromArrayManagementDB: pullIdFromArrayManagementDB,
    remove: remove,
    removePropertyId: removePropertyId,
    updatePatch: updatePatch,
    updatePatchMany: updatePatchMany,
    uploadAdd: uploadAdd,
    uploadPatch: uploadPatch,
    uploadRemove: uploadRemove,
  };
};
