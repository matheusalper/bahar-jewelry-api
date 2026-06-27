import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', 'change_me_access_secret'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'change_me_refresh_secret'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { accessToken, refreshToken };
  }

  private safeUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      baharParaBalance: user.baharParaBalance,
      role: user.role,
    };
  }

  async register(dto: RegisterDto) {
    // E-posta benzersizlik kontrolü
    const byEmail = await this.usersService.findByEmail(dto.email);
    if (byEmail) {
      throw new ConflictException('Bu e-posta adresiyle daha önce üyelik oluşturulmuş. Giriş yapmayı deneyin.');
    }

    // Kullanıcı adı benzersizlik kontrolü
    if (dto.username) {
      const byUsername = await this.usersService.findByUsername(dto.username);
      if (byUsername) {
        throw new ConflictException('Bu kullanıcı adı daha önce alınmış. Lütfen farklı bir kullanıcı adı seçin.');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      birthDate: dto.birthDate,
      password: hashedPassword,
    });

    const tokens = await this.issueTokens(user);
    return { user: this.safeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('E-posta veya şifre hatalı');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('E-posta veya şifre hatalı');
    const tokens = await this.issueTokens(user);
    return { user: this.safeUser(user), ...tokens };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
    return this.safeUser(user);
  }

  async checkUsername(username: string): Promise<{ available: boolean; message?: string }> {
    if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return { available: false, message: 'Kullanıcı adı 3-20 karakter, harf/rakam/alt çizgi içerebilir' };
    }
    const available = await this.usersService.isUsernameAvailable(username);
    return {
      available,
      message: available ? 'Kullanıcı adı müsait' : 'Bu kullanıcı adı daha önce alınmış',
    };
  }

  async checkEmail(email: string): Promise<{ available: boolean; message?: string }> {
    const available = await this.usersService.isEmailAvailable(email);
    return {
      available,
      message: available ? 'E-posta kullanılabilir' : 'Bu e-posta adresiyle daha önce üyelik oluşturulmuş',
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'change_me_refresh_secret'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token geçersiz veya süresi dolmuş');
    }
  }
}
