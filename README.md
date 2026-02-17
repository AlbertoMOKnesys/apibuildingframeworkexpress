# apibuildingframeworkexpress

Fast API building framework over Express.js with MongoDB integration. Quickly create CRUD endpoints with built-in pagination, filtering, file uploads, and schema validation.

## Installation

```bash
npm install apibuildingframeworkexpress
```

## Requirements

- Node.js >= 14.x
- MongoDB
- [mongoclienteasywrapper](https://www.npmjs.com/package/mongoclienteasywrapper) (peer dependency)

## Quick Start

```javascript
const express = require('express');
const MongoWrapper = require('mongoclienteasywrapper')(mongoUrl);
const apiBuilder = require('apibuildingframeworkexpress')(MongoWrapper);

const app = express();
app.use(express.json());

// Basic CRUD routes
app.get('/users', apiBuilder.list());
app.get('/users/:_id', apiBuilder.listOne());
app.post('/users', apiBuilder.create());
app.patch('/users/:_id', apiBuilder.updatePatch());
app.delete('/users/:_id', apiBuilder.remove());

app.listen(3000);
```

## API Reference

### CRUD Operations

| Method | Description | Parameters |
|--------|-------------|------------|
| `list(params)` | List all documents with pagination | Database, Collection, Middleware |
| `listOne(params)` | Get single document by _id | Database, Collection, Middleware |
| `create(params)` | Create new document | Database, Collection, PathBaseFile, URL, AsyncFunctionAfter, Middleware |
| `updatePatch(params)` | Update document by _id | Database, Collection, PathBaseFile, URL, AsyncFunctionAfter, Middleware |
| `updatePatchMany(params)` | Update multiple documents | Database, Collection, Middleware |
| `remove(params)` | Soft delete document | Database, Collection, Middleware |

### Filtered Queries

| Method | Description |
|--------|-------------|
| `listFilter(params)` | Advanced filtering with aggregation |
| `listFilter2(params)` | Extended filtering with comparison operators |

### File Operations

| Method | Description |
|--------|-------------|
| `docUpload(params)` | Upload single file/icon |
| `docRemove(params)` | Remove uploaded file |
| `fileUpload(params)` | Upload multiple files |
| `uploadAdd(params)` | Add document to array |
| `uploadPatch(params)` | Update document in array |
| `uploadRemove(params)` | Remove document from array |

### Utilities

| Method | Description |
|--------|-------------|
| `distinct(params)` | Get distinct values |
| `removePropertyId(params)` | Remove property from document |
| `pullIdFromArrayManagementDB(params)` | Pull ID from array |

## Query Parameters

### Filtering Operators

Use these suffixes in query parameters for advanced filtering:

```
GET /users?name_partial=john        # Partial match (regex)
GET /users?status_string=active     # Exact string match
GET /users?active_boolean=true      # Boolean match
GET /users?role_id=507f1f77bcf86cd799439011  # ObjectId match
GET /users?role_neid=507f1f77bcf86cd799439011  # Not equal ObjectId
GET /users?status_nestring=deleted  # Not equal string
GET /users?age_igtei=18             # Integer >= 18
GET /users?age_iltei=65             # Integer < 65
GET /users?createdAt_dgted=2024-01-01  # Date >= 2024-01-01
```

### Pagination

```
GET /users?page=0&limit=10
```

### Sorting

```
GET /users?sortMongoAsc=name        # Ascending
GET /users?sortMongoDec=createdAt   # Descending
```

### Projection

```
GET /users?projectMongo=name&projectMongo=email
```

### Lookup (Populate)

```
GET /users?lookup=roles
```

## Middleware / Schema Validation

```javascript
const { Middlewares } = require('apibuildingframeworkexpress')(MongoWrapper);

// With express-validator
app.post('/users', 
  Middlewares.validateSchemaExpress(userSchema),
  apiBuilder.create()
);

// With Yup
app.post('/users',
  Middlewares.validateSchemaYup(yupSchema),
  apiBuilder.create()
);
```

## Advanced Usage

### Custom Database/Collection

```javascript
app.get('/custom', apiBuilder.list({
  Database: 'myDatabase',
  Collection: 'myCollection'
}));
```

### Using as Middleware

```javascript
app.get('/users', 
  apiBuilder.list({ Middleware: true }),
  (req, res) => {
    // Access response in req.MidResponse
    const data = req.MidResponse;
    res.json({ ...data, customField: 'value' });
  }
);
```

### Assignments (Relations)

```javascript
// In request body, use _Assign to create relations
POST /users
{
  "name": "John",
  "_Assign": [
    { "roles": ["roleId1", "roleId2"] }
  ]
}

// Use _UnAssign to remove relations (in PATCH)
PATCH /users/:id
{
  "_UnAssign": [
    { "roles": ["roleId1"] }
  ]
}
```

### Async Function After

```javascript
app.post('/users', apiBuilder.create({
  AsyncFunctionAfter: async (req, res, dbResponse) => {
    // Execute after document creation
    await sendWelcomeEmail(dbResponse.insertedId);
  }
}));
```

## Response Format

All endpoints return consistent response format:

```javascript
// Success
{
  "status": "ok",
  "message": "completed",
  "data": { /* document(s) */ },
  "rows": 10  // for list operations
}

// Error
{
  "status": "error",
  "message": "db error",
  "data": { /* error details */ }
}
```

## Authors

- Alberto Martinez
- Gustavo Luna
- Taylor Gonzalez
- Jose Tello

## License

MIT

## Links

- [GitHub Repository](https://github.com/AlbertoMOKnesys/apibuildingframeworkexpress)
- [npm Package](https://www.npmjs.com/package/apibuildingframeworkexpress)
- [Issues](https://github.com/AlbertoMOKnesys/apibuildingframeworkexpress/issues)
