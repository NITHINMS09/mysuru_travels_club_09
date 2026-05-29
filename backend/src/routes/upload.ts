import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Configure multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Single file upload endpoint
router.post('/single', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'tripnova_uploads',
    });

    res.status(200).json({
      url: result.secure_url,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Configure multer for large video uploads
const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

// Video file upload endpoint
router.post('/video', videoUpload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to cloudinary as video
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'video',
      folder: 'tripnova_videos',
      eager: [
        { format: 'jpg', resource_type: 'video' } // Automatically generate thumbnail
      ],
      eager_async: false,
    });

    res.status(200).json({
      url: result.secure_url,
      thumbnailUrl: result.eager?.[0]?.secure_url || result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: result.bytes,
      duration: Math.round(result.duration || 0)
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Video upload failed' });
  }
});

export default router;
