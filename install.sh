#!/usr/bin/env bash
# Bahar Jewelry API — Kurulum Script'i
# Bu script: bağımlılıkları kurar, Postgres+Redis'i (Docker varsa) ayağa kaldırır,
# veritabanı migration'larını çalıştırır ve örnek verilerle (seed) doldurur.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}➜${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "${RED}✖${NC} $1"; exit 1; }

echo ""
echo "🌸 Bahar Jewelry API — Kurulum başlıyor"
echo "----------------------------------------"

# 1) Node.js kontrolü
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js bulunamadı. Lütfen Node.js 18+ kurun: https://nodejs.org"
fi
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js 18 veya üstü gerekli. Mevcut sürüm: $(node -v)"
fi
info "Node.js sürümü uygun: $(node -v)"

# 2) .env dosyası
if [ ! -f .env ]; then
  cp .env.example .env
  info ".env dosyası .env.example'dan oluşturuldu. Gerekirse JWT secret'larını değiştirin."
else
  info ".env dosyası zaten mevcut, dokunulmadı."
fi

# 3) Docker var mı kontrolü -> varsa Postgres + Redis'i otomatik ayağa kaldır
DOCKER_AVAILABLE=false
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DOCKER_AVAILABLE=true
fi

if [ "$DOCKER_AVAILABLE" = true ]; then
  info "Docker bulundu. PostgreSQL ve Redis container'ları başlatılıyor..."
  docker compose up -d postgres redis

  info "Veritabanının hazır olması bekleniyor..."
  for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U bahar >/dev/null 2>&1; then
      info "PostgreSQL hazır."
      break
    fi
    sleep 1
    if [ "$i" -eq 30 ]; then
      fail "PostgreSQL 30 saniye içinde hazır olmadı. 'docker compose logs postgres' ile kontrol edin."
    fi
  done
else
  warn "Docker bulunamadı. PostgreSQL ve Redis'in zaten çalıştığını ve .env'deki bilgilerle eşleştiğini varsayıyorum."
  warn "Docker kurmak isterseniz: https://docs.docker.com/get-docker/"
  warn "Docker'sız manuel kurulum (Ubuntu/Debian):"
  warn "  sudo apt-get install -y postgresql redis-server"
  warn "  sudo service postgresql start && sudo service redis-server start"
fi

# 4) Bağımlılıkları kur
info "npm bağımlılıkları kuruluyor (bu biraz sürebilir)..."
npm install

# 5) Migration'ları çalıştır
info "Veritabanı migration'ları çalıştırılıyor..."
npm run migration:run

# 6) Seed (örnek kategori + ürün verisi)
info "Örnek kategori ve ürün verileri ekleniyor (seed)..."
npm run seed || warn "Seed sırasında hata oldu (veriler zaten ekliyse bu normal olabilir)."

echo ""
echo "----------------------------------------"
echo -e "${GREEN}✅ Kurulum tamamlandı!${NC}"
echo ""
echo "Geliştirme sunucusunu başlatmak için:"
echo "  npm run start:dev"
echo ""
echo "API şu adreste çalışacak: http://localhost:3000/api"
echo "Örnek istek:  curl http://localhost:3000/api/products"
echo ""
