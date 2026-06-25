import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function slugify(text: string): string {
  return text
    .replace(/İ/g, 'i') // JS toLowerCase() İ harfini 'i' + combining dot yapar, önce elle düzeltiyoruz
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  // GET /api/products?category=kolye&page=1&limit=20
  async findAll(query: Record<string, string>) {
    const page = Math.max(parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(query.limit ?? '20', 10), 1), 100);

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.category) {
      qb.andWhere('LOWER(category.name) = LOWER(:category)', { category: query.category });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`"${slug}" slug'lı ürün bulunamadı`);
    return product;
  }

  // Cart/Order modülleri ürünü id ile doğrulamak için bunu kullanır
  async findById(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return product;
  }

  // Faz 3'te: dto.images burada doğrudan URL string'leri olarak kabul ediliyor;
  // gerçek dosya upload (multipart -> S3) ayrı bir adımda eklenecek.
  async create(dto: CreateProductDto) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Kategori bulunamadı');

    const baseSlug = slugify(dto.title);
    let slug = baseSlug;
    let suffix = 1;
    while (await this.productRepo.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${++suffix}`;
    }

    const product = this.productRepo.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      images: dto.images ?? [],
      category,
      slug,
    });
    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['category'] });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Kategori bulunamadı');
      product.category = category;
    }

    Object.assign(product, {
      title: dto.title ?? product.title,
      description: dto.description ?? product.description,
      price: dto.price ?? product.price,
      stock: dto.stock ?? product.stock,
      images: dto.images ?? product.images,
    });

    return this.productRepo.save(product);
  }

  async remove(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    await this.productRepo.remove(product);
    return { deleted: true };
  }
}
