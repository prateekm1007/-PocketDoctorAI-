const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

const TEMP_DIR = '/tmp/uploads';
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`)
});

const smartUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/jpg','application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
  }
});

async function streamToS3(filePath, bucketName, key, contentType) {
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const fileStream = fs.createReadStream(filePath);
  const up = new Upload({ client: s3, params: { Bucket: bucketName, Key: key, Body: fileStream, ContentType: contentType } });
  up.on('httpUploadProgress', (p) => {
    if (p.total) {
      const pct = Math.round((p.loaded / p.total) * 100);
      console.log(`📤 Upload ${key}: ${pct}%`);
    }
  });
  const result = await up.done();
  fs.unlink(filePath, () => {});
  return result;
}

function cleanupTempFiles(err, req, res, next) {
  if (req.file?.path && fs.existsSync(req.file.path)) {
    fs.unlink(req.file.path, () => {});
  }
  next(err);
}

module.exports = { smartUpload, streamToS3, cleanupTempFiles };
