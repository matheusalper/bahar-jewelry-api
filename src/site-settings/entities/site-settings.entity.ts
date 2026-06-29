import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('site_settings')
export class SiteSettings {
  // Bu tablo her zaman tek bir satır içerir (id=1) — site genel ayarları
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'jsonb', default: {} })
  banner: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  announcementBar: any[];

  @Column({ type: 'jsonb', default: {} })
  socialLinks: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  contactInfo: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  paymentSettings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  baharParaSettings: Record<string, any>;

  // SEO ayarları
  @Column({ type: 'jsonb', default: {} })
  seoSettings: Record<string, any>;

  // Tracking kodları (GA4, GTM, Pixel vb.)
  @Column({ type: 'jsonb', default: {} })
  trackingCodes: Record<string, any>;

  // Redirect kuralları
  @Column({ type: 'jsonb', default: [] })
  redirectRules: any[];

  // Robots.txt içeriği
  @Column({ type: 'text', nullable: true })
  robotsTxt: string;
}
