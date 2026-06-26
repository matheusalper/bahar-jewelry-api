import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private readonly campaignRepo: Repository<Campaign>,
  ) {}

  // GET /api/campaigns           -> admin yönetim ekranı için TÜMÜ
  // GET /api/campaigns?activeOnly=true -> storefront: aktif + tarih aralığı içinde olanlar
  async findAll(query: Record<string, string> = {}) {
    const all = await this.campaignRepo.find({ order: { sortOrder: 'ASC' } });
    if (query.activeOnly !== 'true') return all;

    const today = new Date().toISOString().slice(0, 10);
    return all.filter((c) => {
      if (!c.isActive) return false;
      if (c.startDate && c.startDate > today) return false;
      if (c.endDate && c.endDate < today) return false;
      return true;
    });
  }

  async findOne(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');
    return campaign;
  }

  async create(dto: CreateCampaignDto) {
    const campaign = this.campaignRepo.create({
      ...dto,
      membersOnly: dto.membersOnly ?? true,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.campaignRepo.save(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);
    Object.assign(campaign, dto);
    return this.campaignRepo.save(campaign);
  }

  async remove(id: string) {
    const campaign = await this.findOne(id);
    await this.campaignRepo.remove(campaign);
    return { deleted: true };
  }
}
