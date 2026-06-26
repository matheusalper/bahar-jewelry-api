import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/&/g, 've')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  // GET /api/categories  — admin yönetim ekranı için TÜM kategoriler
  // GET /api/categories?activeOnly=true — storefront için sadece aktif + menüde gösterilecekler, sıralı
  async findAll(query: Record<string, string> = {}) {
    const qb = this.categoryRepo.createQueryBuilder('category').orderBy('category.sortOrder', 'ASC');
    if (query.activeOnly === 'true') {
      qb.andWhere('category.isActive = true');
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Kategori bulunamadı');
    return category;
  }

  private async generateUniqueSlug(base: string, ignoreId?: string): Promise<string> {
    const baseSlug = slugify(base);
    let slug = baseSlug;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.categoryRepo.findOne({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      slug = `${baseSlug}-${++suffix}`;
    }
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ? slugify(dto.slug) : await this.generateUniqueSlug(dto.name);
    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description,
      image: dto.image,
      showInMenu: dto.showInMenu ?? true,
      showOnHomepage: dto.showOnHomepage ?? true,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (dto.slug && dto.slug !== category.slug) {
      category.slug = await this.generateUniqueSlug(dto.slug, id);
    }
    Object.assign(category, {
      name: dto.name ?? category.name,
      description: dto.description ?? category.description,
      image: dto.image ?? category.image,
      showInMenu: dto.showInMenu ?? category.showInMenu,
      showOnHomepage: dto.showOnHomepage ?? category.showOnHomepage,
      isActive: dto.isActive ?? category.isActive,
      sortOrder: dto.sortOrder ?? category.sortOrder,
    });
    return this.categoryRepo.save(category);
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    const productCount = await this.productRepo.count({ where: { category: { id } } });
    if (productCount > 0) {
      throw new BadRequestException(
        `Bu kategoriye bağlı ${productCount} ürün var. Önce bu ürünleri başka bir kategoriye taşıyın veya silin.`,
      );
    }
    await this.categoryRepo.remove(category);
    return { deleted: true };
  }
}
