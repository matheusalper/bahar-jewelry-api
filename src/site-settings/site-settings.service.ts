import { Injectable } from '@nestjs/common';
import { InjectRepository as InjectRepo } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './entities/site-settings.entity';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

const PAYMENT_SETTINGS_DEFAULT: Record<string, any> = {
  cardEnabled: false,       // Kredi / banka kartı (iyzico/PayTR)
  bankTransferEnabled: true, // Havale / EFT
  cashOnDeliveryEnabled: false, // Kapıda ödeme
  whatsappEnabled: true,    // WhatsApp sipariş
  provider: 'mock',         // 'mock' | 'iyzico' | 'paytr'
  testMode: true,
  apiKey: '',
  secretKey: '',
  merchantId: '',
  callbackUrl: '',
  successUrl: '',
  failUrl: '',
  bankName: '',
  iban: '',
  accountHolder: '',
  cashOnDeliverySurcharge: 0, // Kapıda ödemede eklenecek tutar (TL)
};

const DEFAULTS = {
  banner: {
    active: true,
    badge: 'Yeni sezon çelik takı koleksiyonu',
    title: 'Çelik Kadar Kalıcı, Bahar Kadar Zarif',
    description:
      'Kararma yapmayan, suya dayanıklı ve günlük şıklığınızı tamamlayan çelik takı koleksiyonları Bahar Takı\'da.',
    button1Text: 'Koleksiyonu Keşfet',
    button1Link: '#koleksiyon',
    button2Text: 'Yeni Gelenleri Gör',
    button2Link: '#one-cikanlar',
    image: '',
    bgColor: '#FAF7F2',
    textColor: '#221E1B',
    accentColor: '#BFA46F',
  },
  announcementBar: [
    { text: '750 TL ve üzeri alışverişlerde ücretsiz kargo', link: '', newTab: false, active: true, sortOrder: 1 },
    { text: 'Kararma yapmayan çelik takı koleksiyonları', link: '', newTab: false, active: true, sortOrder: 2 },
    { text: 'WhatsApp üzerinden hızlı sipariş imkanı', link: '', newTab: false, active: true, sortOrder: 3 },
    { text: 'Yeni sezon ürünleri Bahar Takı\'da', link: '', newTab: false, active: true, sortOrder: 4 },
  ],
  socialLinks: {
    active: true,
    title: 'Bizi Takip Edin',
    description: 'Yeni ürünler, kampanyalar ve kombin önerileri için Bahar Takı\'yı sosyal medyada takip edin.',
    instagramUsername: '',
    instagramLink: '',
    tiktokLink: '',
    whatsappLink: '',
    facebookLink: '',
    pinterestLink: '',
  },
  contactInfo: {
    whatsappNumber: '905XXXXXXXXX',
    phone: '',
    email: 'info@bahartaki.com',
    instagramUsername: '',
    address: '',
    mapEmbedUrl: '',
    workingHours: 'Her gün · 10:00 – 20:00',
    description: 'Sipariş, ürün ve stok bilgisi için bize WhatsApp, Instagram veya e-posta üzerinden ulaşabilirsiniz.',
    whatsappButtonText: 'WhatsApp\'tan Yaz',
    contactFormActive: true,
  },
  paymentSettings: PAYMENT_SETTINGS_DEFAULT,
};

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings) private readonly repo: Repository<SiteSettings>,
  ) {}

  async getSettings(): Promise<SiteSettings> {
    let settings = await this.repo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.repo.create({ id: 1, ...DEFAULTS });
      settings = await this.repo.save(settings);
    }
    return settings;
  }


  async generateSitemap(): Promise<string> {
    const SITE = 'https://bahartaki.com';
    const now = new Date().toISOString().split('T')[0];
    // Static pages
    const staticUrls = [
      { loc: SITE, priority: '1.0', changefreq: 'daily' },
      { loc: `${SITE}/products.html`, priority: '0.9', changefreq: 'daily' },
      { loc: `${SITE}/new-arrivals.html`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${SITE}/bestsellers.html`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${SITE}/sale.html`, priority: '0.7', changefreq: 'daily' },
    ];
    const urls = staticUrls.map(u =>
      `  <url><loc>${u.loc}</loc><lastmod>${now}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    ).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  }

  async getRobotsTxt(): Promise<string> {
    const settings = await this.getSettings();
    if (settings.robotsTxt) return settings.robotsTxt;
    return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: https://bahartaki.com/sitemap.xml\n`;
  }

  async updateSettings(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    const settings = await this.getSettings();
    if (dto.banner) settings.banner = { ...settings.banner, ...dto.banner };
    if (dto.announcementBar) settings.announcementBar = dto.announcementBar;
    if (dto.socialLinks) settings.socialLinks = { ...settings.socialLinks, ...dto.socialLinks };
    if (dto.contactInfo) settings.contactInfo = { ...settings.contactInfo, ...dto.contactInfo };
    if (dto.paymentSettings) settings.paymentSettings = { ...settings.paymentSettings, ...dto.paymentSettings };
    if (dto.baharParaSettings) settings.baharParaSettings = { ...settings.baharParaSettings, ...dto.baharParaSettings };
    if (dto.seoSettings) settings.seoSettings = { ...settings.seoSettings, ...dto.seoSettings };
    if (dto.trackingCodes) settings.trackingCodes = { ...settings.trackingCodes, ...dto.trackingCodes };
    if (dto.redirectRules !== undefined) settings.redirectRules = dto.redirectRules;
    if (dto.robotsTxt !== undefined) settings.robotsTxt = dto.robotsTxt;
    return this.repo.save(settings);
  }
}
