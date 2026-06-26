import dataSource from './data-source';
import { Category } from './products/entities/category.entity';
import { Product } from './products/entities/product.entity';

const CATEGORIES = ['Kolye', 'Küpe', 'Bilezik', 'Yüzük', 'Set', 'Saç & Bijuteri', 'Halhal'];

const SAMPLE_PRODUCTS: Record<string, { title: string; price: number; stock: number }[]> = {
  Kolye: [
    { title: 'İnce Zincir Kolye', price: 249.9, stock: 12 },
    { title: 'Taşlı Katlı Kolye', price: 279.9, stock: 8 },
    { title: 'Harf Kolye (Kişiye Özel)', price: 229.9, stock: 15 },
    { title: 'Pul Zincir Kolye', price: 259.9, stock: 10 },
  ],
  Küpe: [
    { title: 'Zirkon Taşlı Küpe', price: 189.9, stock: 20 },
    { title: 'İnce Halka Küpe', price: 159.9, stock: 18 },
  ],
  Bilezik: [
    { title: 'Halka Bilezik Seti', price: 329.9, stock: 6 },
  ],
  Halhal: [
    { title: 'İnce Zincir Halhal', price: 199.9, stock: 14 },
    { title: 'Taşlı Sallantılı Halhal', price: 219.9, stock: 9 },
  ],
};

function slugify(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seed() {
  const ds = await dataSource.initialize();
  const categoryRepo = ds.getRepository(Category);
  const productRepo = ds.getRepository(Product);

  console.log('🌱 Kategoriler ekleniyor...');
  const categoryMap = new Map<string, Category>();
  for (const name of CATEGORIES) {
    let category = await categoryRepo.findOne({ where: { name } });
    if (!category) {
      category = await categoryRepo.save(categoryRepo.create({ name }));
    }
    categoryMap.set(name, category);
    console.log(`  ✓ ${name}`);
  }

  console.log('🌱 Örnek ürünler ekleniyor...');
  for (const [categoryName, products] of Object.entries(SAMPLE_PRODUCTS)) {
    const category = categoryMap.get(categoryName)!;
    for (const p of products) {
      const slug = slugify(p.title);
      const exists = await productRepo.findOne({ where: { slug } });
      if (exists) continue;
      await productRepo.save(
        productRepo.create({ ...p, slug, category, images: [] }),
      );
      console.log(`  ✓ ${p.title}`);
    }
  }

  console.log('✅ Seed tamamlandı.');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
