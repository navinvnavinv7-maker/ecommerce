import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

let storage;

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'nexus_products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      // Cloudinary automatic optimizations
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }
  });
  console.log('☁️ Cloudinary integration initialized successfully.');
} else {
  // Local filesystem disk storage fallback
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.log('📂 Cloudinary credentials missing. Fallback configured to local disk storage uploads.');
}

// Reusable upload parser instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per image
  }
});
