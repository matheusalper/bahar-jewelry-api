import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { ProductsService } from '../products/products.service';

export interface CartItem {
  productId: string;
  quantity: number;
}

type Identity = { type: 'user' | 'guest'; id: string; newSessionId?: string };

const CART_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 gün

@Injectable()
export class CartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly productsService: ProductsService,
  ) {}

  // Authorization header'da geçerli bir JWT varsa kullanıcı sepeti, yoksa
  // X-Cart-Session header'ındaki misafir oturum id'si kullanılır.
  // Hiçbiri yoksa yeni bir misafir oturumu üretilir (cevapta sessionId olarak döner).
  private async resolveIdentity(req: any): Promise<Identity> {
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await this.jwtService.verifyAsync(authHeader.slice(7), {
          secret: this.config.get('JWT_ACCESS_SECRET', 'change_me_access_secret'),
        });
        return { type: 'user', id: payload.sub };
      } catch {
        // token geçersiz/süresi dolmuş -> misafir olarak devam et
      }
    }

    const sessionHeader = req.headers?.['x-cart-session'];
    if (sessionHeader) return { type: 'guest', id: sessionHeader };

    const newId = randomUUID();
    return { type: 'guest', id: newId, newSessionId: newId };
  }

  private cartKey(identity: Identity) {
    return `cart:${identity.type}:${identity.id}`;
  }

  private async readItems(key: string): Promise<CartItem[]> {
    const raw = await this.redis.get(key);
    return raw ? JSON.parse(raw) : [];
  }

  private async writeItems(key: string, items: CartItem[]) {
    if (items.length === 0) {
      await this.redis.del(key);
      return;
    }
    await this.redis.set(key, JSON.stringify(items), 'EX', CART_TTL_SECONDS);
  }

  // Sepeti ürün detaylarıyla (başlık, fiyat, görsel) zenginleştirip toplamları hesaplar
  private async enrich(items: CartItem[]) {
    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await this.productsService.findById(item.productId);
        return {
          productId: item.productId,
          title: product.title,
          price: Number(product.price),
          quantity: item.quantity,
          subtotal: Math.round(Number(product.price) * item.quantity * 100) / 100,
          stock: product.stock,          // toplam stok — frontend limiti için
          inStock: product.stock >= item.quantity,
        };
      }),
    );
    const totalPrice = Math.round(enriched.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;
    const totalItems = enriched.reduce((sum, i) => sum + i.quantity, 0);
    return { items: enriched, totalPrice, totalItems };
  }

  async getCart(req: any) {
    const identity = await this.resolveIdentity(req);
    const items = await this.readItems(this.cartKey(identity));
    const { items: enriched, totalPrice, totalItems } = await this.enrich(items);
    return {
      sessionId: identity.newSessionId,
      items: enriched,
      totalPrice,
      totalItems,
    };
  }

  async addItem(req: any, body: { productId: string; quantity: number }) {
    if (!body.productId || !body.quantity || body.quantity < 1) {
      throw new BadRequestException('productId ve quantity (>=1) gereklidir');
    }
    await this.productsService.findById(body.productId); // ürün var mı doğrula

    const identity = await this.resolveIdentity(req);
    const key = this.cartKey(identity);
    const items = await this.readItems(key);

    const existing = items.find((i) => i.productId === body.productId);
    if (existing) {
      existing.quantity += body.quantity;
    } else {
      items.push({ productId: body.productId, quantity: body.quantity });
    }

    await this.writeItems(key, items);
    const { items: enriched, totalPrice, totalItems } = await this.enrich(items);
    return { sessionId: identity.newSessionId, items: enriched, totalPrice, totalItems };
  }

  async removeItem(req: any, productId: string) {
    const identity = await this.resolveIdentity(req);
    const key = this.cartKey(identity);
    const items = (await this.readItems(key)).filter((i) => i.productId !== productId);
    await this.writeItems(key, items);
    const { items: enriched, totalPrice, totalItems } = await this.enrich(items);
    return { sessionId: identity.newSessionId, items: enriched, totalPrice, totalItems };
  }

  async clearCart(req: any) {
    const identity = await this.resolveIdentity(req);
    await this.redis.del(this.cartKey(identity));
    return { cleared: true };
  }

  // Login sonrası: misafir sepetindeki ürünleri kullanıcı sepetine taşır (miktarları toplar)
  async mergeGuestCart(guestSessionId: string, userId: string) {
    const guestKey = `cart:guest:${guestSessionId}`;
    const userKey = `cart:user:${userId}`;

    const guestItems = await this.readItems(guestKey);
    if (guestItems.length === 0) return this.readItems(userKey);

    const userItems = await this.readItems(userKey);
    for (const guestItem of guestItems) {
      const existing = userItems.find((i) => i.productId === guestItem.productId);
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        userItems.push(guestItem);
      }
    }

    await this.writeItems(userKey, userItems);
    await this.redis.del(guestKey);
    return userItems;
  }

  // OrdersService checkout sırasında ham (zenginleştirilmemiş) sepet öğelerine ihtiyaç duyar
  async getRawItemsForUser(userId: string): Promise<CartItem[]> {
    return this.readItems(`cart:user:${userId}`);
  }

  async clearUserCart(userId: string) {
    await this.redis.del(`cart:user:${userId}`);
  }

  // Misafir checkout sırasında ham sepet öğelerine ihtiyaç duyar
  async getRawItemsForGuest(sessionId: string): Promise<CartItem[]> {
    return this.readItems(`cart:guest:${sessionId}`);
  }

  async clearGuestCart(sessionId: string) {
    await this.redis.del(`cart:guest:${sessionId}`);
  }
}
