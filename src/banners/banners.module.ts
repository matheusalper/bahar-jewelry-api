import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { ImageProcessingService } from './image-processing.service';
import { Banner } from './entities/banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersController],
  providers: [BannersService, ImageProcessingService],
  exports: [BannersService],
})
export class BannersModule {}
