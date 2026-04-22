import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { SimulationService } from '../common/simulation/simulation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User]),
    BeneficiariesModule,
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
