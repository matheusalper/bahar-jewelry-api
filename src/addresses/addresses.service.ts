import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address) private readonly addressRepo: Repository<Address>,
  ) {}

  async findAllForUser(userId: string) {
    return this.addressRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  private async findOwned(id: string, userId: string) {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Adres bulunamadı');
    if (address.userId !== userId) throw new ForbiddenException('Bu adrese erişim yetkiniz yok');
    return address;
  }

  // Yeni adres varsayilan isaretlenirse, kullanicinin diger adreslerindeki varsayilan isaretini kaldirir
  private async clearOtherDefaults(userId: string, exceptId?: string) {
    const qb = this.addressRepo
      .createQueryBuilder()
      .update(Address)
      .set({ isDefault: false })
      .where('userId = :userId', { userId });
    if (exceptId) qb.andWhere('id != :exceptId', { exceptId });
    await qb.execute();
  }

  async create(userId: string, dto: CreateAddressDto) {
    const isFirstAddress = (await this.addressRepo.count({ where: { userId } })) === 0;
    const address = this.addressRepo.create({
      ...dto,
      userId,
      isDefault: dto.isDefault || isFirstAddress, // ilk adres otomatik varsayılan olur
    });
    const saved = await this.addressRepo.save(address);
    if (saved.isDefault) await this.clearOtherDefaults(userId, saved.id);
    return saved;
  }

  async update(id: string, userId: string, dto: UpdateAddressDto) {
    const address = await this.findOwned(id, userId);
    Object.assign(address, dto);
    const saved = await this.addressRepo.save(address);
    if (saved.isDefault) await this.clearOtherDefaults(userId, saved.id);
    return saved;
  }

  async setDefault(id: string, userId: string) {
    const address = await this.findOwned(id, userId);
    address.isDefault = true;
    const saved = await this.addressRepo.save(address);
    await this.clearOtherDefaults(userId, saved.id);
    return saved;
  }

  async remove(id: string, userId: string) {
    const address = await this.findOwned(id, userId);
    await this.addressRepo.remove(address);
    return { deleted: true };
  }
}
