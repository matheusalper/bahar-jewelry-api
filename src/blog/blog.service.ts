import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogStatus } from './entities/blog-post.entity';

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/İ/g,'i').replace(/Ğ/g,'g').replace(/Ü/g,'u')
    .replace(/Ş/g,'s').replace(/Ö/g,'o').replace(/Ç/g,'c')
    .replace(/[^a-z0-9\s-]/g,'').trim()
    .replace(/\s+/g,'-').replace(/-+/g,'-');
}

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly repo: Repository<BlogPost>,
  ) {}

  async findAll(query: any = {}) {
    const page  = Math.max(parseInt(query.page  ?? '1'),  1);
    const limit = Math.min(parseInt(query.limit ?? '12'), 50);
    const skip  = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('p')
      .orderBy('p.publishedAt', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .skip(skip).take(limit);

    if (query.status) qb.where('p.status = :s', { s: query.status });
    else qb.where('p.status = :s', { s: BlogStatus.PUBLISHED });

    if (query.category) qb.andWhere('p.category = :c', { c: query.category });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const post = await this.repo.findOne({ where: { slug } });
    if (!post) throw new NotFoundException('Yazı bulunamadı');
    // Görüntülenme sayısını artır
    await this.repo.update(post.id, { viewCount: (post.viewCount || 0) + 1 });
    return post;
  }

  async findById(id: string) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Yazı bulunamadı');
    return post;
  }

  async create(dto: any, authorId?: string) {
    let slug = dto.slug || slugify(dto.title);
    // Unique slug kontrolü
    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const post = this.repo.create({
      ...dto,
      slug,
      authorId: authorId || null,
      publishedAt: dto.status === BlogStatus.PUBLISHED ? new Date() : null,
    });
    return this.repo.save(post);
  }

  async update(id: string, dto: any) {
    const post = await this.findById(id);
    if (dto.title && !dto.slug) dto.slug = slugify(dto.title);
    if (dto.status === BlogStatus.PUBLISHED && !post.publishedAt) {
      dto.publishedAt = new Date();
    }
    Object.assign(post, dto);
    return this.repo.save(post);
  }

  async delete(id: string) {
    const post = await this.findById(id);
    await this.repo.remove(post);
    return { deleted: true };
  }

  async getCategories() {
    const rows = await this.repo
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('p.status = :s', { s: BlogStatus.PUBLISHED })
      .andWhere('p.category IS NOT NULL')
      .groupBy('p.category')
      .getRawMany();
    return rows;
  }

  // Sitemap için tüm yayınlanmış yazılar
  async getPublishedSlugs() {
    return this.repo.find({
      where: { status: BlogStatus.PUBLISHED },
      select: ['slug', 'updatedAt'],
    });
  }
}
