const fs = require('fs/promises');
const cloudinary = require('../config/cloudinary');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Si Cloudinary esta configurado, sube cada archivo que multer ya guardo en
// disco local, borra la copia local y deja la URL publica en file.url.
// Si no esta configurado (desarrollo local), no hace nada: los controllers
// arman la URL local /uploads/... como siempre.
async function uploadToCloudinaryIfConfigured(files, folder) {
  if (!isCloudinaryConfigured) return;

  const list = Array.isArray(files) ? files : [files];
  await Promise.all(list.map(async (file) => {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `academiapro/${folder}`,
    });
    file.url = result.secure_url;
    await fs.unlink(file.path).catch(() => {});
  }));
}

module.exports = { uploadToCloudinaryIfConfigured, isCloudinaryConfigured };
