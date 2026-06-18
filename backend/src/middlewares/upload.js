const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Si hay un bucket de GCS configurado, los archivos van en memoria (buffer) para
// subirlos al bucket desde el controller. Si no, se mantiene el guardado en disco local
// (modo dev sin credenciales de Google).
const useGCS = !!process.env.GCS_BUCKET;

const uploadDir = path.join(__dirname, '../../uploads/materials');
if (!useGCS && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = useGCS
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.ppt', '.pptx',
    '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.zip'
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  }
});

module.exports = upload;
