import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/ai')
export class AiController {

  @Post('generate')
  async generate(@Body() body: { prompt: string; type?: string; imageBase64?: string; imageMediaType?: string }) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { error: 'ANTHROPIC_API_KEY ayarlanmamış.' };
    }

    const systemPrompt = body.type === 'blog'
      ? 'Sen Bahar Accessory & Jewelry (bahartaki.com) için SEO odaklı blog içeriği üreten bir uzman yazarsın. Bu marka 316L paslanmaz çelik takı satmaktadır — kararma yapmaz, suya dayanıklı. Türkçe, akıcı ve profesyonel yaz.'
      : body.type === 'product_vision'
      ? `Sen Bahar Accessory & Jewelry için ürün analizi yapan bir uzmansın. Bu marka paslanmaz çelik takı satmaktadır — gümüş veya altın değil.

ÜRÜN ADI KURALLARI:
- Zarif, şık ve butik bir dil kullan
- Ürün adı "316L" ile başlamasın
- Örnekler: "Zarif Taşlı Çelik Kolye", "Zirkon Taşlı Çelik Bileklik", "İnce Zincirli Çelik Küpe", "Minimalist Çelik Yüzük", "Toka", "Saç Tokası"
- Ürünün tam olarak ne olduğunu belirt — toka ise toka, küpe ise küpe yaz
- Max 50 karakter, Türkçe

AÇIKLAMA KURALLARI:
- Paslanmaz çelik malzemeyi doğal belirt
- Kararma yapmaz ve suya dayanıklı vurgula
- Şık ve premium dil kullan, 80-100 kelime`
      : 'Sen Bahar Accessory & Jewelry (bahartaki.com) için SEO içeriği üreten bir uzmansın. Türkçe, kısa ve etkili yaz.';

    // Görsel varsa vision modeli kullan
    const model = body.imageBase64 ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';

    // Mesaj içeriği
    let messageContent: any;
    if (body.imageBase64) {
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: body.imageMediaType || 'image/jpeg',
            data: body.imageBase64,
          },
        },
        { type: 'text', text: body.prompt },
      ];
    } else {
      messageContent = body.prompt;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: messageContent }],
        }),
      });

      const data = await response.json() as any;
      if (!response.ok) return { error: data.error?.message || 'API hatası' };
      return { result: data.content?.[0]?.text || '' };
    } catch (err: any) {
      return { error: err.message || 'Bağlantı hatası' };
    }
  }
}
