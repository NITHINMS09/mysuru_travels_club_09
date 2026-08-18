import { Router } from 'express';
import multer from 'multer';
import prisma from '../config/database';
import { uploadBufferToCloudinary, getCloudinaryFolder } from '../utils/cloudinary';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer with memory storage for single uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for general/profile uploads
});

// Configure multer for large video uploads
const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

// Helper to save file locally as fallback
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

// Helper to get backend base URL for local fallback
const getBackendUrl = (req: any) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${config.port}`;
  return `${protocol}://${host}`;
};

// Single file upload endpoint (images/documents)
router.post('/single', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadType = (req.query.type as string) || 'upload';

    // MIME type validation based on upload type
    const isImage = req.file.mimetype.startsWith('image/');
    const isDoc = req.file.mimetype === 'application/pdf' || 
                  req.file.mimetype === 'application/msword' || 
                  req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                  req.file.mimetype === 'text/plain';

    // Restrict profile/selfie/logo/trip to image only
    const imageOnlyTypes = ['profile', 'avatar', 'selfie', 'logo', 'trip', 'blog', 'marketplace'];
    if (imageOnlyTypes.includes(uploadType) && !isImage) {
      return res.status(400).json({ error: 'Only image files are allowed for this upload category.' });
    }

    if (!isImage && !isDoc) {
      return res.status(400).json({ error: 'File format not supported. Only images and documents are allowed.' });
    }

    const isCloudinaryConfigured = 
      config.cloudinary.cloudName && 
      config.cloudinary.cloudName !== 'your_cloud_name_here' &&
      config.cloudinary.apiKey && 
      config.cloudinary.apiKey !== 'your_api_key_here' &&
      config.cloudinary.apiSecret && 
      config.cloudinary.apiSecret !== 'your_api_secret_here';

    if (!isCloudinaryConfigured) {
      // Fallback to local storage
      const relativeUrl = await saveFileLocally(req.file, 'uploads');
      const fullUrl = `${getBackendUrl(req)}${relativeUrl}`;
      return res.status(200).json({
        url: fullUrl,
        fileName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    // Upload via the central Cloudinary utility
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      uploadType
    );

    // Save metadata in MongoDB Atlas
    const asset = await prisma.cloudinaryAsset.create({
      data: {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        originalFilename: result.original_filename,
        folder: getCloudinaryFolder(uploadType),
      }
    });

    return res.status(200).json({
      url: result.secure_url,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      assetId: asset.id
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Video file upload endpoint
router.post('/video', videoUpload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Validate video MIME type
    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({ error: 'Only video files are supported at this endpoint.' });
    }

    const isCloudinaryConfigured = 
      config.cloudinary.cloudName && 
      config.cloudinary.cloudName !== 'your_cloud_name_here' &&
      config.cloudinary.apiKey && 
      config.cloudinary.apiKey !== 'your_api_key_here' &&
      config.cloudinary.apiSecret && 
      config.cloudinary.apiSecret !== 'your_api_secret_here';

    if (!isCloudinaryConfigured) {
      // Fallback to local storage
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

    // Upload via the central Cloudinary utility
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      'video'
    );

    // Save metadata in MongoDB Atlas
    const asset = await prisma.cloudinaryAsset.create({
      data: {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        originalFilename: result.original_filename,
        folder: getCloudinaryFolder('video'),
      }
    });

    return res.status(200).json({
      url: result.secure_url,
      thumbnailUrl: result.thumbnailUrl || result.secure_url,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: result.bytes || req.file.size,
      duration: Math.round(result.duration || 0),
      assetId: asset.id
    });
  } catch (error: any) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: error.message || 'Video upload failed' });
  }
});

export default router;
