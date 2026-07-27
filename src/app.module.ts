import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BotModule } from './bot/bot.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { AccountsModule } from './accounts/accounts.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PurchasesModule } from './purchases/purchases.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ExpirationModule } from './expiration/expiration.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
    ]),
    ScheduleModule.forRoot(),
    BotModule,
    UsersModule,
    ServicesModule,
    AccountsModule,
    ProfilesModule,
    PurchasesModule,
    TransactionsModule,
    PrismaModule,
    AdminModule,
    AuthModule,
    ExpirationModule,
  ],
})
export class AppModule {}
