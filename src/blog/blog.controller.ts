import {
  Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // GET /api/blog — yayınlanmış yazılar
  @Get()
  findAll(@Query() query: any) {
    return this.blogService.findAll(query);
  }

  // GET /api/blog/categories
  @Get('categories')
  getCategories() {
    return this.blogService.getCategories();
  }

  // GET /api/blog/:slug
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  adminGetAll(@Query() query: any) {
    return this.blogService.findAll({ ...query, status: query.status || undefined });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.blogService.create(dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.blogService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}
