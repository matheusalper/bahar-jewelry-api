import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
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

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // GET /api/auth/check-username?username=test123
  @Get('check-username')
  checkUsername(@Query('username') username: string) {
    return this.authService.checkUsername(username);
  }

  // GET /api/auth/check-email?email=test@test.com
  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    return this.authService.checkEmail(email);
  }

  // GET /api/auth/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.id);
  }

  // PUT /api/auth/me
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.id, dto);
    return {
      id: user.id, name: user.name, username: user.username,
      email: user.email, phone: user.phone, birthDate: user.birthDate,
      role: user.role, createdAt: user.createdAt,
    };
  }

  // PUT /api/auth/me/password
  @UseGuards(JwtAuthGuard)
  @Put('me/password')
  updatePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.updatePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
