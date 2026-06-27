import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductImage } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImageDto } from './dto/product-image.dto';

function slugify(text: string): string {
  return text
    .replace(/İ/g, 'i') // JS toLowerCase() İ harfini 'i' + combining dot yapar, önce elle düzeltiyoruz
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Gelen gorsel listesini normallestirir: en fazla 4 adet, sirali 'order',
// ve TAM OLARAK bir adet isMain (istemci birini isaretlemisse o, yoksa ilk gorsel).
function normalizeImages(images: ProductImageDto[] | undefined, fallbackAlt: string): ProductImage[] {
  if (!images || images.length === 0) return [];
  const capped = images.slice(0, 4);
  const mainIndex = Math.max(0, capped.findIndex((img) => img.isMain === true));
  return capped.map((img, index) => ({
    url: img.url,
    alt: img.alt || fallbackAlt,
    order: index,
    isMain: index === mainIndex,
  }));
}

// API yanitinda kullanisli turetilmis alanlar ekler (isSale, mainImage) — DB'ye yazilmaz.
function withComputedFields(product: Product) {
  const sale =
    product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const sorted = [...(product.images || [])].sort((a, b) => a.order - b.order);
  const mainImage = sorted.find((i) => i.isMain)?.url || sorted[0]?.url || null;
  return { ...product, images: sorted, isSale: sale, mainImage };
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
    const limit = Math.min(Math.max(parseInt(query.limit ?? '40', 10), 1), 100);
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (query.includeInactive !== 'true') qb.andWhere('product.isActive = true');

    if (query.categorySlug) {
      qb.andWhere('LOWER(category.slug) = LOWER(:slug)', { slug: query.categorySlug });
    } else if (query.category) {
      // Tek veya virgülle ayrılmış çoklu kategori: "kolye,küpe"
      const cats = query.category.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (cats.length === 1) {
        qb.andWhere('LOWER(category.name) = LOWER(:cat)', { cat: cats[0] });
      } else if (cats.length > 1) {
        qb.andWhere('LOWER(category.name) IN (:...cats)', { cats });
      }
    }
    if (query.featuredOnly === 'true') qb.andWhere('product.isFeatured = true');
    if (query.newOnly === 'true')      qb.andWhere('product.isNew = true');
    if (query.bestSeller === 'true')   qb.andWhere('product.isBestSeller = true');
    if (query.inStock === 'true')      qb.andWhere('product.stock > 0');
    if (query.onSale === 'true') {
      qb.andWhere('product.salePrice IS NOT NULL').andWhere('product.salePrice < product.price');
    }

    const effectivePrice = '(CASE WHEN product.salePrice IS NOT NULL AND product.salePrice < product.price THEN product.salePrice ELSE product.price END)';
    if (query.minPrice && !isNaN(parseFloat(query.minPrice))) {
      qb.andWhere(`${effectivePrice} >= :min`, { min: parseFloat(query.minPrice) });
    }
    if (query.maxPrice && !isNaN(parseFloat(query.maxPrice))) {
      qb.andWhere(`${effectivePrice} <= :max`, { max: parseFloat(query.maxPrice) });
    }

    const sort = query.sort ?? 'newest';
    if (sort === 'price-asc')  qb.orderBy(effectivePrice, 'ASC');
    else if (sort === 'price-desc') qb.orderBy(effectivePrice, 'DESC');
    else qb.orderBy('product.createdAt', 'DESC');

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(withComputedFields), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`"${slug}" slug'lı ürün bulunamadı`);
    return withComputedFields(product);
  }

  // Cart/Order modülleri ürünü id ile doğrulamak için bunu kullanır
  async findById(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return product;
  }

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
      shortDescription: dto.shortDescription,
      price: dto.price,
      salePrice: dto.salePrice,
      stock: dto.stock,
      sku: dto.sku,
      images: normalizeImages(dto.images, dto.title),
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      isNew: dto.isNew ?? false,
      isBestSeller: dto.isBestSeller ?? false,
      category,
      slug,
    });
    const saved = await this.productRepo.save(product);
    return withComputedFields(saved);
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
      shortDescription: dto.shortDescription ?? product.shortDescription,
      price: dto.price ?? product.price,
      salePrice: dto.salePrice !== undefined ? dto.salePrice : product.salePrice,
      stock: dto.stock ?? product.stock,
      sku: dto.sku ?? product.sku,
      images: dto.images ? normalizeImages(dto.images, dto.title ?? product.title) : product.images,
      isActive: dto.isActive ?? product.isActive,
      isFeatured: dto.isFeatured ?? product.isFeatured,
      isNew: dto.isNew ?? product.isNew,
      isBestSeller: dto.isBestSeller ?? product.isBestSeller,
    });

    const saved = await this.productRepo.save(product);
    return withComputedFields(saved);
  }

  async remove(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    await this.productRepo.remove(product);
    return { deleted: true };
  }
}
