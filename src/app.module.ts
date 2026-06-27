import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './redis/redis.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { BannersModule } from './banners/banners.module';
import { AddressesModule } from './addresses/addresses.module';
import { BankTransfersModule } from './bank-transfers/bank-transfers.module';
import { BaharParaModule } from './bahar-para/bahar-para.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: parseInt(config.get('DATABASE_PORT', '5432'), 10),
        username: config.get('DATABASE_USER', 'bahar'),
        password: config.get('DATABASE_PASSWORD', 'bahar_dev_password'),
        database: config.get('DATABASE_NAME', 'bahar_jewelry'),
        autoLoadEntities: true,
        synchronize: false, // Faz 1: migration kullanıyoruz, synchronize KAPALI (production alışkanlığı)
      }),
    }),
    UsersModule,
    AuthModule,
    RedisModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentModule,
    AdminModule,
    SiteSettingsModule,
    CampaignsModule,
    BannersModule,
    AddressesModule,
    BankTransfersModule,
    BaharParaModule,
  ],
})
export class AppModule {}
