# Bahar Jewelry API

Bahar Accessory & Jewelry için öğrenme/deneme amaçlı, tam donanımlı bir e-ticaret backend'i.
Spesifikasyon: `taki.md` (Node.js/NestJS, PostgreSQL, Redis, S3, JWT, Docker).

## Mimari

```
Client (mevcut bahartaki.com sitesi / Postman)
        ↓
NestJS API (REST, :3000)
        ↓
 ┌──────────────┬──────────────┬──────────────┐
 PostgreSQL      Redis           S3 (görseller)
 (ürün/sipariş)  (sepet/cache)   (ürün fotoğrafları)
```

## Modüller

| Modül     | Sorumluluk                                              | Durum        |
|-----------|----------------------------------------------------------|--------------|
| auth      | Kayıt, giriş, JWT (access+refresh), rol bazlı yetki      | İskelet ✅    |
| products  | Ürün CRUD, kategori, varyant, slug                       | İskelet ✅    |
| cart      | Redis tabanlı sepet, guest cart, login sonrası merge     | İskelet ✅    |
| orders    | Checkout, sipariş durumu, stok rezervasyonu              | İskelet ✅    |
| payment   | Iyzico/Stripe entegrasyonu, webhook                      | İskelet ✅    |
| admin     | Ürün/sipariş yönetimi, dashboard metrikleri              | İskelet ✅    |
| common    | Filtreler, interceptor'lar, dekoratörler (paylaşılan)    | İskelet ✅    |

## Fazlar (bu sırayla ilerleyeceğiz)

- **Faz 0 — İskelet (şu an buradayız):** Klasör yapısı, modül stub'ları, örnek HTML sayfası, onay.
- **Faz 1:** PostgreSQL + Prisma/TypeORM bağlantısı, `Product`/`Category`/`User` modelleri, migration.
- **Faz 2:** Auth modülü gerçek implementasyon (JWT, bcrypt, register/login).
- **Faz 3:** Product modülü gerçek implementasyon (CRUD, görsel upload → S3 veya yerel disk).
- **Faz 4:** Redis bağlantısı + Cart modülü gerçek implementasyon.
- **Faz 5:** Order + Payment modülü (mock ödeme ile MVP, sonra Iyzico).
- **Faz 6:** Admin endpoint'leri + basit dashboard.
- **Faz 7:** Docker Compose ile hepsini bir araya getirme, .env yönetimi.

## Yerel geliştirme (Faz 1'den itibaren)

```bash
docker compose up -d        # Postgres + Redis ayağa kalkar
cp .env.example .env
npm install
npm run start:dev
```

## Not

Bu proje şu an **öğrenme/deneme** amaçlı kuruluyor. `bahartaki.com` üzerindeki canlı site
(Netlify + statik HTML) bundan ayrı ve bağımsız çalışmaya devam ediyor — bu API'yi gerçek
müşterilere açmadan önce gerçek bir sunucuda (Railway/Render/VPS) barındırma, güvenlik
sıkılaştırması ve maliyet planlaması ayrı bir konuşma konusu olacak.
