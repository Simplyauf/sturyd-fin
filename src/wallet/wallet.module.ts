import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { User } from '../entities/user.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { NiumModule } from '../common/nium/nium.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletBalance, User]),
    NiumModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
