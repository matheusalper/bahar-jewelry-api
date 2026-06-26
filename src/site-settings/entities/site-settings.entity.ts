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
}
