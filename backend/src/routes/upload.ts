import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    // If it's an audio blob from Web Audio API without extension, append .webm or .wav
    if (!ext && file.mimetype.includes('audio')) {
      cb(null, file.fieldname + '-' + uniqueSuffix + '.webm');
    } else {
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for files/voice notes
});

// Single file upload endpoint
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL path to access the file
    // Assuming backend serves static files from 'public' directory
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      url: fileUrl,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
