import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Product } from './products/entities/product.entity';
import { Category } from './products/entities/category.entity';
import { User } from './users/entities/user.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { SiteSettings } from './site-settings/entities/site-settings.entity';
import { Campaign } from './campaigns/entities/campaign.entity';
import { Banner } from './banners/entities/banner.entity';
import { Address } from './addresses/entities/address.entity';
import { BankTransferLog } from './bank-transfers/entities/bank-transfer-log.entity';
import { BaharParaTransaction } from './bahar-para/entities/bahar-para-transaction.entity';
import { BlogPost } from './blog/entities/blog-post.entity';
import { Review } from './reviews/entities/review.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'bahar',
  password: process.env.DATABASE_PASSWORD ?? 'bahar_dev_password',
  database: process.env.DATABASE_NAME ?? 'bahar_jewelry',
  entities: [Product, Category, User, Order, OrderItem, SiteSettings, Campaign, Banner, Address, BankTransferLog, BaharParaTransaction, BlogPost, Review],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
