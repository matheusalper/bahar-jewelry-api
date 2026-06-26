import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(data: { name: string; email: string; password: string }): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async updateProfile(id: string, data: { name?: string; phone?: string }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Kullanıcı bulunamadı');
    Object.assign(user, {
      name: data.name ?? user.name,
      phone: data.phone !== undefined ? data.phone : user.phone,
    });
    return this.userRepo.save(user);
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Kullanıcı bulunamadı');
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) throw new UnauthorizedException('Mevcut şifre hatalı');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { updated: true };
  }
}
