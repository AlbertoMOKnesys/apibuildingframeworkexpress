/**
 * Query builder helpers for listFilter and listFilter2 functions.
 * These functions construct MongoDB aggregation pipeline stages from request query params.
 *
 * @module helpers/queryBuilders
 */

/**
 * Builds MongoDB projection object from query params.
 * Projection determines which fields to include in the response.
 *
 * @param {Object} query - Request query object
 * @returns {Object} MongoDB projection object
 *
 * @example
 * // Single field
 * // ?projectMongo=name -> { name: true }
 *
 * @example
 * // Multiple fields
 * // ?projectMongo=name&projectMongo=email -> { name: true, email: true }
 */
const buildProjection = (query) => {
  if (!query.hasOwnProperty("projectMongo")) {
    return {};
  }

  if (Array.isArray(query.projectMongo)) {
    return query.projectMongo.reduce((acc, field) => {
      return { ...acc, [field]: true };
    }, {});
  }

  return { [query.projectMongo]: true };
};

/**
 * Extracts concatenation configuration from query params.
 * Used to create computed fields by concatenating existing fields.
 *
 * @param {Object} query - Request query object
 * @returns {Object} { concatName, concatMongo }
 *
 * @example
 * // ?fullName_concat=["$firstName", " ", "$lastName"]
 * // Returns: { concatName: "fullName", concatMongo: ["$firstName", " ", "$lastName"] }
 */
const buildConcatenation = (query) => {
  const concatKey = Object.keys(query).find((key) => key.includes("_concat"));

  if (!concatKey) {
    return { concatName: null, concatMongo: null };
  }

  const concatName = concatKey.replace("_concat", "");

  return {
    concatName,
    concatMongo: JSON.parse(query[concatKey]),
  };
};

/**
 * Builds sort configuration from query params.
 * Supports both ascending (sortMongoAsc) and descending (sortMongoDec) sorting.
 *
 * @param {Object} query - Request query object
 * @returns {Object} MongoDB sort object
 *
 * @example
 * // ?sortMongoAsc=name -> { name: 1 }
 * // ?sortMongoDec=createdAt -> { createdAt: -1 }
 * // ?sortMongoAsc=name&sortMongoDec=createdAt -> { name: 1, createdAt: -1 }
 */
const buildSortConfig = (query) => {
  let sortAsc = {};
  let sortDesc = {};

  // Build ascending sort
  if (query.hasOwnProperty("sortMongoAsc")) {
    if (Array.isArray(query.sortMongoAsc)) {
      sortAsc = query.sortMongoAsc.reduce((acc, field) => {
        return { ...acc, [field]: 1 };
      }, {});
    } else {
      sortAsc = { [query.sortMongoAsc]: 1 };
    }
  }

  // Build descending sort
  if (query.hasOwnProperty("sortMongoDec")) {
    if (Array.isArray(query.sortMongoDec)) {
      sortDesc = query.sortMongoDec.reduce((acc, field) => {
        return { ...acc, [field]: -1 };
      }, {});
    } else {
      sortDesc = { [query.sortMongoDec]: -1 };
    }
  }

  // Merge both sort configs
  if (
    query.hasOwnProperty("sortMongoDec") ||
    query.hasOwnProperty("sortMongoAsc")
  ) {
    return { ...sortAsc, ...sortDesc };
  }

  return {};
};

/**
 * Builds all filter queries from request params.
 * Extracts filters based on their suffixes (_id, _string, _partial, etc.)
 *
 * @param {Object} query - Request query object
 * @param {Object} queryFunctions - Object containing query builder functions
 * @param {Function} queryFunctions.GetGenericQueryId - Builds ObjectId query
 * @param {Function} queryFunctions.GetGenericQueryString - Builds string query
 * @param {Function} queryFunctions.GetGenericQueryBool - Builds boolean query
 * @param {Function} queryFunctions.GetGenericQueryNeid - Builds not-equal ObjectId query
 * @param {Function} queryFunctions.GetGenericQueryNestring - Builds not-equal string query
 * @returns {Object} Object containing all filter arrays
 */
const buildAllFilters = (query, queryFunctions) => {
  const {
    GetGenericQueryId,
    GetGenericQueryString,
    GetGenericQueryBool,
    GetGenericQueryNeid,
    GetGenericQueryNestring,
  } = queryFunctions;

  // Not equal ObjectId filters (_neid suffix)
  const neidBuilders = Object.keys(query)
    .filter((key) => key.includes("_neid"))
    .map((key) => ({
      Property: key.replace("ne", ""),
      Search: query[key],
    }));
  const neidQueries = neidBuilders.map((e) => GetGenericQueryNeid(e));

  // Not equal string filters (_nestring suffix)
  const nestringBuilders = Object.keys(query)
    .filter((key) => key.includes("_nestring"))
    .map((key) => ({
      Property: key.replace("_nestring", ""),
      Search: query[key],
    }));
  const nestringQueries = nestringBuilders.map((e) =>
    GetGenericQueryNestring(e),
  );

  // Exact string match filters (_string suffix, excluding _nestring and _afterString)
  const stringBuilders = Object.keys(query)
    .filter(
      (key) =>
        key.includes("_string") &&
        !key.includes("_nestring") &&
        !key.includes("_afterString"),
    )
    .map((key) => ({
      Property: key.replace("_string", ""),
      Search: query[key],
    }));
  const stringQueries = stringBuilders.map((e) => GetGenericQueryString(e));

  // Integer filters (_integer suffix)
  const integerBuilders = Object.keys(query)
    .filter((key) => key.includes("_integer"))
    .map((key) => ({
      Property: key.replace("_integer", ""),
      Search: parseInt(query[key]),
    }));
  const integerQueries = integerBuilders.map((e) => GetGenericQueryString(e));

  // ObjectId filters (_id suffix)
  const idBuilders = Object.keys(query)
    .filter((key) => key.includes("_id"))
    .map((key) => ({
      Property: key,
      Search: query[key],
    }));
  const idQueries = idBuilders.map((e) => GetGenericQueryId(e));

  // Boolean filters (_boolean suffix)
  const boolBuilders = Object.keys(query)
    .filter((key) => key.includes("_boolean"))
    .map((key) => ({
      Property: key.replace("_boolean", ""),
      Search: query[key],
    }));
  const boolQueries = boolBuilders.map((e) => GetGenericQueryBool(e));

  // Partial/regex match filters (_partial suffix, excluding _afterPartial)
  const partialBuilders = Object.keys(query)
    .filter((key) => key.includes("_partial") && !key.includes("_afterPartial"))
    .map((key) => ({
      Property: key.replace("_partial", ""),
      Search: query[key],
    }));

  return {
    neidQueries,
    nestringQueries,
    stringQueries,
    integerQueries,
    idQueries,
    boolQueries,
    partialBuilders,
  };
};

/**
 * Builds lookup stages for MongoDB aggregation.
 * Creates $lookup stages to populate/join related collections.
 *
 * @param {Object} query - Request query object
 * @returns {Array} Array of $lookup stages
 *
 * @example
 * // ?lookup=roles
 * // Returns: [{ $lookup: { from: "roles", localField: "roles_id", foreignField: "_id", as: "roles" } }]
 */
const buildLookupStages = (query) => {
  if (!query.hasOwnProperty("lookup")) {
    return [];
  }

  if (Array.isArray(query.lookup)) {
    return query.lookup.map((collectionName) => ({
      $lookup: {
        from: collectionName,
        localField: collectionName + "_id",
        foreignField: "_id",
        as: collectionName,
      },
    }));
  }

  return [
    {
      $lookup: {
        from: query.lookup,
        localField: query.lookup + "_id",
        foreignField: "_id",
        as: query.lookup,
      },
    },
  ];
};

/**
 * Builds extended lookup stages for listFilter2.
 * Allows specifying which local field to use for the lookup.
 *
 * @param {Object} query - Request query object
 * @returns {Array} Array of $lookup stages
 *
 * @example
 * // ?roles_lookup=user_id
 * // Returns: [{ $lookup: { from: "roles", localField: "user_id", foreignField: "_id", as: "rolesuser_id" } }]
 */
const buildLookupStagesExtended = (query) => {
  return Object.keys(query)
    .filter((key) => key.includes("_lookup"))
    .reduce((acc, key) => {
      const collectionName = key.replace("_lookup", "");

      if (Array.isArray(query[key])) {
        const arrLookup = query[key].map((property) => ({
          $lookup: {
            from: collectionName,
            localField: property,
            foreignField: "_id",
            as: collectionName + property,
          },
        }));
        return [...acc, ...arrLookup];
      }

      return [
        ...acc,
        {
          $lookup: {
            from: collectionName,
            localField: query[key],
            foreignField: "_id",
            as: collectionName + query[key],
          },
        },
      ];
    }, []);
};

/**
 * Builds date range query if initialDate and finalDate are provided.
 *
 * @param {Object} query - Request query object
 * @param {string} propertyDateFilter - Field name to filter on (defaults to "datetime")
 * @returns {Array} Array with date filter or empty array
 *
 * @example
 * // ?initialDate=2024-01-01&finalDate=2024-12-31
 * // Returns: [{ datetime: { $gte: Date, $lt: Date } }]
 */
const buildDateRangeQuery = (query, propertyDateFilter) => {
  if (
    query.hasOwnProperty("initialDate") &&
    query.hasOwnProperty("finalDate")
  ) {
    return [
      {
        [propertyDateFilter]: {
          $gte: new Date(query.initialDate),
          $lt: new Date(query.finalDate),
        },
      },
    ];
  }
  return [];
};

/**
 * Builds secondary $match stage for post-lookup filters.
 * Uses _afterPartial and _afterString suffixes for filters that
 * need to run after lookups have populated related data.
 *
 * @param {Object} query - Request query object
 * @param {Object} queryFunctions - Object containing query builder functions
 * @param {Function} queryFunctions.GetGenericQueryString - Builds string query
 * @param {Function} queryFunctions.GetGenericQueryPartial - Builds partial/regex query
 * @returns {Object} MongoDB $match stage
 */
const buildAfterMatchStage = (query, queryFunctions) => {
  const { GetGenericQueryString, GetGenericQueryPartial } = queryFunctions;

  // After string filters
  const afterStringBuilders = Object.keys(query)
    .filter((key) => key.includes("_afterString"))
    .map((key) => ({
      Property: key.replace("_afterString", ""),
      Search: query[key],
    }));
  const afterStringQueries = afterStringBuilders.map((e) =>
    GetGenericQueryString(e),
  );

  // After partial filters
  const afterPartialBuilders = Object.keys(query)
    .filter((key) => key.includes("_afterPartial"))
    .map((key) => ({
      Property: key.replace("_afterPartial", ""),
      Search: query[key],
    }));
  const afterPartialQueries = afterPartialBuilders.map((e) =>
    GetGenericQueryPartial(e),
  );

  const hasAfterFilters =
    afterPartialBuilders.length > 0 || afterStringQueries.length > 0;

  return {
    $match: {
      ...(hasAfterFilters
        ? {
            $and: [
              ...afterStringQueries,
              ...(afterPartialBuilders.length > 0
                ? [{ $or: afterPartialQueries }]
                : []),
            ],
          }
        : {}),
    },
  };
};

/**
 * Builds $facet stage for pagination with metadata.
 * Returns total count, paginated results, and metadata (hasMore flag).
 *
 * @param {number} page - Current page (0-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} MongoDB $facet stage
 */
const buildFacetStage = (page, limit) => ({
  $facet: {
    Total: [{ $count: "Total" }],
    Results: [{ $skip: page > 0 ? page * limit : 0 }, { $limit: limit }],
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
          Hasmore: {
            $gt: [{ $divide: ["$Total", limit * (page + 1)] }, 1],
          },
        },
      },
    ],
  },
});

/**
 * Formats the paginated response from MongoDB aggregation.
 * Extracts and flattens the facet response structure.
 *
 * @param {Array} dbResponse - Raw MongoDB response
 * @param {number} limit - Items per page (0 if no pagination)
 * @param {number} page - Current page
 * @returns {Object|Array} Formatted response
 */
const formatPaginatedResponse = (dbResponse, limit, page) => {
  if (limit > 0) {
    return {
      ...dbResponse[0],
      Total: dbResponse[0].Total.length > 0 ? dbResponse[0].Total[0].Total : 0,
      Metadata:
        dbResponse[0].Total.length > 0
          ? dbResponse[0].Metadata[0]
          : { Hasmore: false, Limit: limit, Page: page },
    };
  }
  return dbResponse;
};

/**
 * Checks if any filters are active based on filter arrays.
 *
 * @param {Object} filters - Object containing filter arrays
 * @param {Array} queryDate - Date range filter array
 * @returns {boolean} True if any filters are active
 */
const hasActiveFilters = (filters, queryDate = []) => {
  return (
    filters.idQueries.length > 0 ||
    filters.partialBuilders.length > 0 ||
    filters.boolQueries.length > 0 ||
    filters.neidQueries.length > 0 ||
    filters.nestringQueries.length > 0 ||
    filters.stringQueries.length > 0 ||
    filters.integerQueries.length > 0 ||
    queryDate.length > 0
  );
};

/**
 * Checks if any filters are active for listFilter2 (includes comparison operators).
 *
 * @param {Object} filters - Object containing filter arrays
 * @param {Object} comparisonFilters - Object containing comparison filter arrays
 * @param {Array} queryDate - Date range filter array
 * @returns {boolean} True if any filters are active
 */
const hasActiveFiltersExtended = (
  filters,
  comparisonFilters,
  queryDate = [],
) => {
  return (
    hasActiveFilters(filters, queryDate) ||
    comparisonFilters.gtQueries.length > 0 ||
    comparisonFilters.gteQueries.length > 0 ||
    comparisonFilters.ltQueries.length > 0 ||
    comparisonFilters.lteQueries.length > 0 ||
    comparisonFilters.gtDateQueries.length > 0 ||
    comparisonFilters.gteDateQueries.length > 0 ||
    comparisonFilters.ltDateQueries.length > 0 ||
    comparisonFilters.lteDateQueries.length > 0
  );
};

/**
 * Builds comparison filter queries for integers.
 * Supports _igt (>), _igte (>=), _ilt (<), _ilte (<=) suffixes.
 *
 * @param {Object} query - Request query object
 * @param {string} operator - Comparison operator (gt, gte, lt, lte)
 * @param {Function} GetGenericComparisonQuery - Query builder function
 * @returns {Array} Array of comparison queries
 *
 * @example
 * // ?age_igtei=18 -> [{ age: { $gte: 18 } }]
 */
const buildIntegerComparisonFilters = (
  query,
  operator,
  GetGenericComparisonQuery,
) => {
  const suffix = "_i" + operator + "i";

  const builders = Object.keys(query)
    .filter((key) => key.includes(suffix))
    .map((key) => ({
      Property: key.replace(suffix, ""),
      Search: parseInt(query[key]),
    }));

  return builders.map((e) => GetGenericComparisonQuery(e, "$" + operator));
};

/**
 * Builds comparison filter queries for dates.
 * Supports _dgt (>), _dgte (>=), _dlt (<), _dlte (<=) suffixes.
 *
 * @param {Object} query - Request query object
 * @param {string} operator - Comparison operator (gt, gte, lt, lte)
 * @param {Function} GetDateComparisonQuery - Query builder function
 * @returns {Array} Array of date comparison queries
 *
 * @example
 * // ?createdAt_dgted=2024-01-01 -> [{ createdAt: { $gte: Date } }]
 */
const buildDateComparisonFilters = (
  query,
  operator,
  GetDateComparisonQuery,
) => {
  const suffix = "_d" + operator + "d";

  const builders = Object.keys(query)
    .filter((key) => key.includes(suffix))
    .map((key) => ({
      Property: key.replace(suffix, ""),
      Search: query[key],
    }));

  return builders.map((e) => GetDateComparisonQuery(e, "$" + operator));
};

/**
 * Builds all comparison filters for listFilter2.
 * Includes both integer and date comparisons.
 *
 * @param {Object} query - Request query object
 * @param {Object} comparisonFunctions - Comparison query builder functions
 * @param {Function} comparisonFunctions.GetGenericComparisonQuery - Integer comparison builder
 * @param {Function} comparisonFunctions.GetDateComparisonQuery - Date comparison builder
 * @returns {Object} Object containing all comparison filter arrays
 */
const buildComparisonFilters = (query, comparisonFunctions) => {
  const { GetGenericComparisonQuery, GetDateComparisonQuery } =
    comparisonFunctions;

  return {
    // Integer comparisons
    gtQueries: buildIntegerComparisonFilters(
      query,
      "gt",
      GetGenericComparisonQuery,
    ),
    gteQueries: buildIntegerComparisonFilters(
      query,
      "gte",
      GetGenericComparisonQuery,
    ),
    ltQueries: buildIntegerComparisonFilters(
      query,
      "lt",
      GetGenericComparisonQuery,
    ),
    lteQueries: buildIntegerComparisonFilters(
      query,
      "lte",
      GetGenericComparisonQuery,
    ),
    // Date comparisons
    gtDateQueries: buildDateComparisonFilters(
      query,
      "gt",
      GetDateComparisonQuery,
    ),
    gteDateQueries: buildDateComparisonFilters(
      query,
      "gte",
      GetDateComparisonQuery,
    ),
    ltDateQueries: buildDateComparisonFilters(
      query,
      "lt",
      GetDateComparisonQuery,
    ),
    lteDateQueries: buildDateComparisonFilters(
      query,
      "lte",
      GetDateComparisonQuery,
    ),
  };
};

module.exports = {
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
  buildIntegerComparisonFilters,
  buildDateComparisonFilters,
};
