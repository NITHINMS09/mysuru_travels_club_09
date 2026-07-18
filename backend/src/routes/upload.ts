import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

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

// Helper to save file locally
const saveFileLocally = async (file: any, subfolder = 'uploads') => {
  const uploadDir = path.join(__dirname, `../../${subfolder}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const fileExt = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}` || '.bin';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
  const filePath = path.join(uploadDir, filename);
  
  await fs.promises.writeFile(filePath, file.buffer);
  return `/${subfolder}/${filename}`;
};

// Helper to get backend base URL
const getBackendUrl = (req: any) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${config.port}`;
  return `${protocol}://${host}`;
};

// Single file upload endpoint
router.post('/single', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isCloudinaryConfigured = 
      config.cloudinary.cloudName && 
      config.cloudinary.cloudName !== 'your_cloud_name_here' &&
      config.cloudinary.apiKey && 
      config.cloudinary.apiKey !== 'your_api_key_here' &&
      config.cloudinary.apiSecret && 
      config.cloudinary.apiSecret !== 'your_api_secret_here';

    if (!isCloudinaryConfigured) {
      // Fallback to local storage for development/sandbox settings
      const relativeUrl = await saveFileLocally(req.file, 'uploads');
      const fullUrl = `${getBackendUrl(req)}${relativeUrl}`;
      return res.status(200).json({
        url: fullUrl,
        fileName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to cloudinary with automatic optimization transformations
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'tripnova_uploads',
      transformation: [
        { width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return res.status(200).json({
      url: result.secure_url,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
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

    const isCloudinaryConfigured = 
      config.cloudinary.cloudName && 
      config.cloudinary.cloudName !== 'your_cloud_name_here' &&
      config.cloudinary.apiKey && 
      config.cloudinary.apiKey !== 'your_api_key_here' &&
      config.cloudinary.apiSecret && 
      config.cloudinary.apiSecret !== 'your_api_secret_here';

    if (!isCloudinaryConfigured) {
      // Fallback to local storage for development/sandbox settings
      const relativeUrl = await saveFileLocally(req.file, 'uploads');
      const fullUrl = `${getBackendUrl(req)}${relativeUrl}`;
      return res.status(200).json({
        url: fullUrl,
        thumbnailUrl: fullUrl,
        fileName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        duration: 0
      });
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

    return res.status(200).json({
      url: result.secure_url,
      thumbnailUrl: result.eager?.[0]?.secure_url || result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: result.bytes,
      duration: Math.round(result.duration || 0)
    });
  } catch (error: any) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: error.message || 'Video upload failed' });
  }
});

export default router;
