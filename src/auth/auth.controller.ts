import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // POST /api/auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /api/auth/refresh
  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // GET /api/auth/me — Hesabım sayfası için profil bilgisi
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt };
  }

  // PUT /api/auth/me — Ad Soyad / Telefon güncelleme
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.id, dto);
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt };
  }

  // PUT /api/auth/me/password — şifre değiştirme
  @UseGuards(JwtAuthGuard)
  @Put('me/password')
  updatePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.updatePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
