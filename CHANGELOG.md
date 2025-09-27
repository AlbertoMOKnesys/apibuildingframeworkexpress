# Changelog

All notable changes to this project will be documented in this file.

---

## [1.0.39] – 2025‑09‑26

### Added

- **`Updated`** multer dependency to 2.0.2 version for better file upload handling

### Changed

- **`create()`** Refactored method to use async file operations instead of sync, improving performance and avoiding event loop blocking.
- **`remove()`** Refactored method to use async file operations instead of sync, improving performance and avoiding event loop blocking.
- **`INTERNAL`** Replaced Promise.all() with Promise.allSettled() for assignments and unassignments operations to prevent complete failure when individual operations fail
- **`INTERNAL`** Improved request body handling to avoid mutations - now uses destructuring to extract special fields (\_Assign, \_Unassign, \_RecursiveDelete)

### Fixed

### Documentation

- **`Added`** inline comments in English for better code understanding.

---
