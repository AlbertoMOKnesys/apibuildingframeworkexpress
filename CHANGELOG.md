# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- Clean up debug console.log statements
- Update dependencies to latest versions
- Improve error handling consistency
- Remove dead/commented code

---

## [1.0.41] – 2025-02-19

### Changed

- Replaced `uuid` package with native `crypto.randomUUID()` for file naming in uploadFileData.js

### Removed

- Removed `uuid` dependency from package.json

### Fixed

- Fixed ERR_REQUIRE_ESM error caused by uuid v13 being ES Module only

---

## [1.0.40] – 2025-02-17

### Added

- GitHub Actions workflow for automatic npm publishing on push to main
- Comprehensive README.md with API documentation
- Improved .gitignore for Node.js projects

### Changed

- Updated Node.js version in CI workflow from 16 to 18
- Updated `express` from ^4.18.1 to ^4.22.1
- Updated `express-validator` from ^7.0.1 to ^7.3.1
- Updated `mongoclienteasywrapper` from ^1.0.10 to ^1.2.7
- Updated `mongodb` from ^4.5.0 to ^4.17.2
- Updated `body-parser` from ^1.20.0 to ^1.20.4
- Updated `multer` from ^1.4.4 to ^2.0.2
- Updated `yup` from ^1.3.3 to ^1.7.1
- Updated `uuid` from ^8.3.2 to ^13.0.0

### Improved

- Expanded package keywords for better npm discoverability

### Documentation

- Added usage examples for all CRUD operations
- Documented query parameter filters and operators
- Added middleware and advanced usage sections

---

## [1.0.39] – 2025-09-26

### Added

- **`Updated`** multer dependency to 2.0.2 version for better file upload handling

### Changed

- **`create()`** Refactored method to use async file operations instead of sync, improving performance and avoiding event loop blocking.
- **`remove()`** Refactored method to use async file operations instead of sync, improving performance and avoiding event loop blocking.
- **`INTERNAL`** Replaced Promise.all() with Promise.allSettled() for assignments and unassignments operations to prevent complete failure when individual operations fail
- **`INTERNAL`** Improved request body handling to avoid mutations - now uses destructuring to extract special fields (\_Assign, \_Unassign, \_RecursiveDelete)

### Documentation

- **`Added`** inline comments in English for better code understanding.

---

## [1.0.38] and earlier

### Features (Historical)

- Generic CRUD operations for Express + MongoDB
- File upload handling with multer
- Schema validation with express-validator and yup
- Soft delete support (`status: "deleted"`)
- Pagination support
- Dynamic collection assignment/unassignment
- Query filtering with multiple operators (`_id`, `_string`, `_partial`, `_boolean`, `_neid`, `_nestring`, comparisons)
- Lookup/populate support via aggregation
- Sorting and projection options
