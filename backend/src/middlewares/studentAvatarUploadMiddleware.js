const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadToCloudinaryIfConfigured } = require('../services/uploadService');

const avatarsDir = path.resolve(__dirname, '../../uploads/avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, safeName);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }
    return cb(null, true);
  },
});

const uploadAvatarMiddleware = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Avatar max size is 2MB' });
      }
      return res.status(400).json({ error: error.message || 'Invalid avatar upload' });
    }

    if (!req.file) return next();

    try {
      await uploadToCloudinaryIfConfigured(req.file, 'avatars');
      return next();
    } catch (uploadError) {
      return res.status(500).json({ error: 'Error al subir el avatar a almacenamiento externo' });
    }
  });
};

module.exports = uploadAvatarMiddleware;
