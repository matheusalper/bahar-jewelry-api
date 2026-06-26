import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
  ) {}

  // GET /api/banners            -> admin yönetim ekranı için TÜMÜ
  // GET /api/banners?activeOnly=true -> storefront: aktif + tarih aralığı içinde olanlar, sıralı
  async findAll(query: Record<string, string> = {}) {
    const all = await this.bannerRepo.find({ order: { sortOrder: 'ASC' } });
    if (query.activeOnly !== 'true') return all;

    const today = new Date().toISOString().slice(0, 10);
    return all.filter((b) => {
      if (!b.isActive) return false;
      if (b.startDate && b.startDate > today) return false;
      if (b.endDate && b.endDate < today) return false;
      return true;
    });
  }

  async findOne(id: string) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner bulunamadı');
    return banner;
  }

  async create(dto: CreateBannerDto) {
    // Yeni banner varsayılan olarak en sona eklenir
    if (dto.sortOrder === undefined) {
      const maxOrder = await this.bannerRepo
        .createQueryBuilder('b')
        .select('MAX(b.sortOrder)', 'max')
        .getRawOne();
      dto.sortOrder = (maxOrder?.max ?? -1) + 1;
    }
    const banner = this.bannerRepo.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.bannerRepo.save(banner);
  }

  async update(id: string, dto: UpdateBannerDto) {
    const banner = await this.findOne(id);
    Object.assign(banner, dto);
    return this.bannerRepo.save(banner);
  }

  async remove(id: string) {
    const banner = await this.findOne(id);
    await this.bannerRepo.remove(banner);
    return { deleted: true };
  }

  async reorder(dto: ReorderBannersDto) {
    await Promise.all(
      dto.items.map((item) => this.bannerRepo.update(item.id, { sortOrder: item.sortOrder })),
    );
    return this.findAll();
  }
}
