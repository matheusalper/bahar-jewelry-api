#!/usr/bin/env sh
# Render her deploy'da bu script'i çalıştırır:
# 1) Bekleyen migration'ları uygular (tablo yoksa oluşturur)
# 2) Seed'i çalıştırır (kategori/ürün zaten varsa atlar, güvenli)
# 3) Sunucuyu başlatır
set -e

echo "🔧 Migration'lar çalıştırılıyor..."
npm run migration:run

echo "🌱 Seed kontrol ediliyor..."
npm run seed || echo "Seed atlandı (veriler zaten mevcut olabilir)."

echo "🌸 Sunucu başlatılıyor..."
node dist/main.js
