import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import path from 'path';

// Configure Cloudinary from central application configs
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Maps logical upload categories/types to specific Cloudinary directories.
 */
export const getCloudinaryFolder = (type?: string): string => {
  switch (type) {
    case 'profile':
    case 'avatar':
      return 'tripnova/profiles';
    case 'user':
      return 'tripnova/users';
    case 'ticket':
    case 'booking':
      return 'tripnova/tickets';
    case 'ticket-attachment':
    case 'screenshot':
      return 'tripnova/ticket-attachments';
    case 'selfie':
      return 'tripnova/selfies';
    case 'document':
    case 'proof':
      return 'tripnova/documents';
    case 'logo':
      return 'tripnova/logos';
    case 'trip':
      return 'tripnova/trips';
    case 'blog':
      return 'tripnova/blogs';
    case 'chat':
      return 'tripnova/chat';
    case 'marketplace':
      return 'tripnova/marketplace';
    default:
      return 'tripnova/uploads';
  }
};

export interface UploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  original_filename: string;
  bytes?: number;
  duration?: number;
  thumbnailUrl?: string;
}

/**
 * Uploads a raw memory buffer to Cloudinary with MIME validation and folder organization.
 */
export const uploadBufferToCloudinary = (
  fileBuffer: Buffer,
  mimetype: string,
  originalName: string,
  type?: string
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');
    const isDoc = mimetype === 'application/pdf' || 
                  mimetype === 'application/msword' || 
                  mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                  mimetype === 'text/plain';

    if (!isImage && !isVideo && !isDoc) {
      return reject(new Error('MIME type not allowed. Supported formats: images, videos, PDFs, and Word documents.'));
    }

    let resource_type: 'image' | 'video' | 'raw' = 'image';
    if (isVideo) resource_type = 'video';
    else if (isDoc) resource_type = 'raw';

    const folder = getCloudinaryFolder(type);
    
    // Prepare name without special characters to avoid Cloudinary naming bugs
    const publicIdName = path.parse(originalName).name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const publicId = `${publicIdName}_${Date.now()}`;

    // Options mapping
    const uploadOptions: any = {
      folder,
      public_id: publicId,
      resource_type,
    };

    // Auto-generate thumbnails for video formats
    if (isVideo) {
      uploadOptions.eager = [
        { format: 'jpg', resource_type: 'video' }
      ];
      uploadOptions.eager_async = false;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload returned empty result'));
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          resource_type: result.resource_type,
          original_filename: originalName,
          bytes: result.bytes,
          duration: result.duration,
          thumbnailUrl: result.eager?.[0]?.secure_url || (result.resource_type === 'video' ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') : undefined)
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Destroys a Cloudinary asset securely via public ID.
 */
export const deleteAssetFromCloudinary = async (publicId: string, resourceType = 'image'): Promise<any> => {
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return res;
  } catch (err: any) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err.message);
    throw err;
  }
};

/**
 * Extracts Cloudinary metadata from a secure URL and deletes the asset.
 * Safely ignores non-Cloudinary / local URLs for absolute compatibility.
 */
export const deleteAssetFromUrl = async (url: string): Promise<any> => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const prefix = parts[0];
    let resourceType = 'image';
    if (prefix.includes('/video/')) resourceType = 'video';
    else if (prefix.includes('/raw/')) resourceType = 'raw';

    const afterUpload = parts[1];
    const segments = afterUpload.split('/');
    // Strip optional versioning element (e.g., 'v1234567890')
    if (segments[0].match(/^v\d+$/)) {
      segments.shift();
    }

    const publicIdWithExt = segments.join('/');
    const dotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = dotIndex > -1 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt;

    return await deleteAssetFromCloudinary(publicId, resourceType);
  } catch (err: any) {
    console.error(`Error deleting asset from URL ${url}:`, err.message);
    return null;
  }
};
