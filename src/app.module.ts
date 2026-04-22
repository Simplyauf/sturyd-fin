import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Beneficiary } from './entities/beneficiary.entity';
import { Transaction } from './entities/transaction.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { LedgerModule } from './ledger/ledger.module';
import { NiumModule } from './common/nium/nium.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'fintech.db',
      entities: [User, Beneficiary, Transaction, WalletBalance, WebhookLog],
      synchronize: true,
    }),

    AuthModule,
    UsersModule,
    BeneficiariesModule,
    TransactionsModule,
    WalletModule,
    WebhooksModule,
    LedgerModule,
    NiumModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

