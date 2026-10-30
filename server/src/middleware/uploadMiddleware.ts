import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/octet-stream'];

    if (allowedExtensions.includes(ext) || mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, TXT, and Markdown (.md) documents are accepted.'));
    }
  }
});
