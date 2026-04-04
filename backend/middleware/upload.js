// ============ FILE UPLOAD MIDDLEWARE ============
// Uses multer for multipart/form-data file handling
// Stores files locally in backend/uploads/ with unique names
// Configurable max file size and allowed types

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ---- Configuration ----
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024; // 10MB default
const MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES) || 5;

// Allowed MIME types by category
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

const ALL_ALLOWED = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document];

// Ensure upload directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
ensureDir(UPLOAD_DIR);

// ---- Storage engine ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by entity type: uploads/tickets/, uploads/contracts/, etc.
    const entityType = req.uploadEntityType || 'misc';
    const dir = path.join(UPLOAD_DIR, entityType);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhex.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext;
    cb(null, uniqueName);
  }
});

// ---- File filter ----
function fileFilter(allowedMimes) {
  return (req, file, cb) => {
    const mimes = allowedMimes || ALL_ALLOWED;
    if (mimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Accepted: ' + mimes.join(', ')), false);
    }
  };
}

// ---- Pre-configured upload handlers ----

/**
 * Upload images (tickets, inspections)
 * Usage: router.post('/photos', setEntityType('tickets'), uploadImages.array('photos', 5), handler)
 */
const uploadImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: fileFilter(ALLOWED_TYPES.image)
});

/**
 * Upload documents (contracts, reports)
 */
const uploadDocuments = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: fileFilter(ALL_ALLOWED)
});

/**
 * Generic upload (any allowed type)
 */
const uploadAny = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: fileFilter(ALL_ALLOWED)
});

/**
 * Middleware to set entity type for upload directory organization
 * @param {string} entityType - 'tickets', 'contracts', etc.
 */
function setEntityType(entityType) {
  return (req, res, next) => {
    req.uploadEntityType = entityType;
    next();
  };
}

/**
 * Delete a file from uploads
 * @param {string} filePath - Relative path within uploads (e.g., 'tickets/1234-abc.jpg')
 * @returns {boolean} success
 */
function deleteUploadedFile(relativePath) {
  try {
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Get file info
 * @param {string} relativePath - Relative path within uploads
 * @returns {Object|null} { path, size, modified }
 */
function getFileInfo(relativePath) {
  try {
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    const stats = fs.statSync(fullPath);
    return {
      path: relativePath,
      size: stats.size,
      modified: stats.mtime.toISOString()
    };
  } catch (e) {
    return null;
  }
}

/**
 * Multer error handler middleware — call after multer upload
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size: ' + (MAX_FILE_SIZE / 1024 / 1024) + 'MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum: ' + MAX_FILES });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  if (err && err.message && err.message.startsWith('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

module.exports = {
  uploadImages,
  uploadDocuments,
  uploadAny,
  setEntityType,
  deleteUploadedFile,
  getFileInfo,
  handleUploadError,
  UPLOAD_DIR,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES
};
