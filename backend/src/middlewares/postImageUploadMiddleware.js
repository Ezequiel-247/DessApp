const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadToCloudinaryIfConfigured } = require('../services/uploadService');

const postsDir = path.resolve(__dirname, '../../uploads/posts');

if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, postsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, safeName);
  },
});

const uploadImages = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, GIF and WEBP images are allowed'));
    }
    return cb(null, true);
  },
});

const uploadPostImagesMiddleware = (req, res, next) => {
  uploadImages.array('images', 5)(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Cada imagen no puede superar los 25MB' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Maximo 5 imagenes por posteo' });
        }
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message || 'Error al subir imagenes' });
    }

    try {
      await uploadToCloudinaryIfConfigured(req.files, 'posts');
      return next();
    } catch (uploadError) {
      return res.status(500).json({ error: 'Error al subir imagenes a almacenamiento externo' });
    }
  });
};

module.exports = uploadPostImagesMiddleware;
