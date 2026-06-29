import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');
    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'bahar-jewelry/products',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
            { width: 1200, height: 1200, crop: 'limit' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Yükleme başarısız'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      ).end(file.buffer);
    });
  }

  async uploadImages(files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('Dosya bulunamadı');
    const results = await Promise.all(files.map(f => this.uploadImage(f)));
    return { images: results };
  }

  async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
