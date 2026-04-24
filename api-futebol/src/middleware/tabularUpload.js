let multer;

try {
  multer = require('multer');
} catch (error) {
  multer = null;
}

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

if (!multer) {
  module.exports = (req, res) =>
    res.status(500).json({
      message: 'Upload de arquivo indisponivel: dependencia multer nao encontrada. Rode npm install.',
    });
} else {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const mimetype = String(file.mimetype || '').toLowerCase();
      if (ALLOWED_MIME_TYPES.has(mimetype)) return cb(null, true);
      return cb(new Error('Formato de arquivo nao suportado. Use CSV ou XLSX.'));
    },
  });

  module.exports = upload.single('file');
}
