import {
  Controller, Post, UploadedFile, UploadedFiles,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UploadService } from './upload.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Tek görsel yükle
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/image\/(jpeg|jpg|png|webp)/)) {
        return cb(new Error('Sadece JPEG, PNG ve WebP desteklenir'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }

  // Çoklu görsel yükle (max 10)
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/image\/(jpeg|jpg|png|webp)/)) {
        return cb(new Error('Sadece JPEG, PNG ve WebP desteklenir'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadImages(files);
  }
}
