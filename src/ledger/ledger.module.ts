import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, WalletBalance])],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
