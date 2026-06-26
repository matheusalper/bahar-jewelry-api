import dataSource from './data-source';
import { Category } from './products/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { SiteSettings } from './site-settings/entities/site-settings.entity';
import { Campaign } from './campaigns/entities/campaign.entity';

const CATEGORIES: { name: string; slug: string; description: string; sortOrder: number }[] = [
  { name: 'Kolye', slug: 'kolye', description: 'Zarafeti boynunuzda taşıyın.', sortOrder: 1 },
  { name: 'Küpe', slug: 'kupe', description: 'Her stile uyum sağlayan dokunuşlar.', sortOrder: 2 },
  { name: 'Bilezik', slug: 'bilezik', description: 'Bilekte zarif bir dokunuş.', sortOrder: 3 },
  { name: 'Yüzük', slug: 'yuzuk', description: 'Parmaklarınızda ışıltı.', sortOrder: 4 },
  { name: 'Set', slug: 'set', description: 'Tam takım şıklık.', sortOrder: 5 },
  { name: 'Saç & Bijuteri', slug: 'sac-bijuteri', description: 'Küçük detaylar, büyük fark.', sortOrder: 6 },
  { name: 'Halhal', slug: 'halhal', description: 'Yaz stilinizi zarif çelik halhal modelleriyle tamamlayın.', sortOrder: 7 },
];

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

const DEFAULT_CAMPAIGNS: Partial<Campaign>[] = [
  { title: 'Üyelere özel %10 indirim', badge: 'Hoş Geldin', description: 'Kod: BAHAR10', sortOrder: 1 },
  { title: 'Yeni gelenlerde erken erişim', badge: 'Üyelere Özel', description: 'Yeni ürünleri ilk siz görün', sortOrder: 2 },
  { title: 'Doğum günü kampanyası', badge: 'Sürpriz', description: 'Doğum ayınıza özel hediye çeki', sortOrder: 3 },
  { title: 'Sepette özel fırsatlar', badge: 'Üyelere Özel', description: 'Seçili ürünlerde ekstra indirim', sortOrder: 4 },
];

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
  const settingsRepo = ds.getRepository(SiteSettings);
  const campaignRepo = ds.getRepository(Campaign);

  console.log('🌱 Kategoriler ekleniyor...');
  const categoryMap = new Map<string, Category>();
  for (const c of CATEGORIES) {
    let category = await categoryRepo.findOne({ where: { name: c.name } });
    if (!category) {
      category = await categoryRepo.save(
        categoryRepo.create({
          name: c.name,
          slug: c.slug,
          description: c.description,
          sortOrder: c.sortOrder,
          showInMenu: true,
          showOnHomepage: true,
          isActive: true,
        }),
      );
    } else {
      // Daha önce slug'sız/sırasız oluşturulmuş kategorileri tamamla (geriye dönük uyumluluk)
      let changed = false;
      if (!category.slug) { category.slug = c.slug; changed = true; }
      if (!category.description) { category.description = c.description; changed = true; }
      if (!category.sortOrder) { category.sortOrder = c.sortOrder; changed = true; }
      if (changed) category = await categoryRepo.save(category);
    }
    categoryMap.set(c.name, category);
    console.log(`  ✓ ${c.name} (${category.slug})`);
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

  console.log('🌱 Site ayarları kontrol ediliyor...');
  const existingSettings = await settingsRepo.findOne({ where: { id: 1 } });
  if (!existingSettings) {
    await settingsRepo.save(
      settingsRepo.create({
        id: 1,
        banner: {
          active: true,
          badge: 'Yeni sezon çelik takı koleksiyonu',
          title: 'Çelik Kadar Kalıcı, Bahar Kadar Zarif',
          description: 'Kararma yapmayan, suya dayanıklı ve günlük şıklığınızı tamamlayan çelik takı koleksiyonları Bahar Takı\'da.',
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
      }),
    );
    console.log('  ✓ Varsayılan site ayarları oluşturuldu');
  } else {
    console.log('  ✓ Site ayarları zaten mevcut, dokunulmadı');
  }

  console.log('🌱 Varsayılan kampanyalar kontrol ediliyor...');
  const campaignCount = await campaignRepo.count();
  if (campaignCount === 0) {
    for (const c of DEFAULT_CAMPAIGNS) {
      await campaignRepo.save(campaignRepo.create({ ...c, membersOnly: true, isActive: true }));
      console.log(`  ✓ ${c.title}`);
    }
  } else {
    console.log('  ✓ Kampanyalar zaten mevcut, dokunulmadı');
  }

  console.log('✅ Seed tamamlandı.');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
