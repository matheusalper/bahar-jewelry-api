import { BadRequestException, Injectable } from '@nestjs/common';
// sharp paketinin tip tanimlari (d.mts/d.cts) bu TS yapilandirmasinda dogru
// cozumlenmiyor; calisma zamaninda sorunsuz oldugu icin plain require kullanildi.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

// NOT: Bu degerleri kendi Supabase projenizden alip doldurun (frontend'deki
// api.js dosyasinda kullandiginiz AYNI degerler).
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

const RECOMMENDED_MIN_WIDTH = 1920;
const RECOMMENDED_MIN_HEIGHT = 900;

// Sitenin krem zemin rengiyle eslesen letterbox arka plani
const LETTERBOX_BG = { r: 247, g: 239, b: 227, alpha: 1 };

interface Variant {
  key: 'desktop' | 'tablet' | 'mobile' | 'thumbnail';
  width: number;
  height: number;
}

const VARIANTS: Variant[] = [
  { key: 'desktop', width: 1920, height: 800 },
  { key: 'tablet', width: 1200, height: 800 },
  { key: 'mobile', width: 900, height: 900 },
  { key: 'thumbnail', width: 500, height: 300 },
];

@Injectable()
export class ImageProcessingService {
  private ensureConfigured() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new BadRequestException(
        'Görsel yükleme henüz yapılandırılmadı (SUPABASE_URL / SUPABASE_ANON_KEY tanımlı değil).',
      );
    }
  }

  private async uploadToSupabase(path: string, buffer: Buffer, contentType: string) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: buffer as any,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new BadRequestException(`Görsel yüklenemedi: ${text || res.status}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
  }

  // folder örn: "banners" — original/desktop/tablet/mobile/thumb alt klasörlerine ayrılır
  async processAndUpload(file: { buffer: Buffer; originalname: string; mimetype: string }, folder: string) {
    this.ensureConfigured();
    if (!file?.buffer?.length) {
      throw new BadRequestException('Görsel dosyası bulunamadı.');
    }

    const metadata = await sharp(file.buffer).metadata();
    const warning =
      (metadata.width || 0) < RECOMMENDED_MIN_WIDTH || (metadata.height || 0) < RECOMMENDED_MIN_HEIGHT
        ? `Daha kaliteli görünüm için en az ${RECOMMENDED_MIN_WIDTH}x${RECOMMENDED_MIN_HEIGHT} px görsel yüklemeniz önerilir.`
        : null;

    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const originalExt = (file.originalname.split('.').pop() || 'jpg').toLowerCase();

    // 1) Orijinal görseli oldugu gibi sakla
    const originalUrl = await this.uploadToSupabase(
      `${folder}/original/${uniqueId}.${originalExt}`,
      file.buffer,
      file.mimetype || 'application/octet-stream',
    );

    // 2) Her boyut icin WebP versiyonu uret (cover crop, ortadan kirpilir)
    const urls: Record<string, string> = { original: originalUrl };
    for (const variant of VARIANTS) {
      const resizedBuffer = await sharp(file.buffer)
        .resize(variant.width, variant.height, { fit: 'contain', background: LETTERBOX_BG })
        .webp({ quality: 90 })
        .toBuffer();
      const path = `${folder}/${variant.key === 'thumbnail' ? 'thumb' : variant.key}/${uniqueId}.webp`;
      urls[variant.key] = await this.uploadToSupabase(path, resizedBuffer, 'image/webp');
    }

    return {
      original: urls.original,
      desktop: urls.desktop,
      tablet: urls.tablet,
      mobile: urls.mobile,
      thumbnail: urls.thumbnail,
      warning,
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
    };
  }
}
