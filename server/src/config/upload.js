const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Local-disk storage: works with zero external credentials. Moving to a
// cloud provider later only touches this file and where avatarUrl is built.
const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fileFilter(req, file, cb) {
  // Server-side check -- never trust the browser's <input accept>.
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
  }
  cb(null, true);
}

const uploadAvatar = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadAvatar, AVATAR_DIR };
