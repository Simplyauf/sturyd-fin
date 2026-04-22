import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(WalletBalance)
    private walletRepo: Repository<WalletBalance>,
  ) {}

  async getPlatformSummary() {
    const all = await this.transactionRepo.find({ relations: ['user'] });

    const settled = all.filter((t) => t.status === TransactionStatus.SETTLED);
    const failed = all.filter((t) => t.status === TransactionStatus.FAILED);
    const pending = all.filter(
      (t) =>
        t.status === TransactionStatus.AWAITING_PAYMENT ||
        t.status === TransactionStatus.PAYIN_COMPLETED ||
        t.status === TransactionStatus.PAYOUT_INITIATED,
    );

    const totalUsdSent = settled.reduce((s, t) => s + Number(t.sourceAmount), 0);
    const totalInrDispatched = settled.reduce((s, t) => s + Number(t.destinationAmount), 0);
    const totalWalletBalance = (await this.walletRepo.find()).reduce(
      (s, w) => s + Number(w.balanceUsd),
      0,
    );

    return {
      summary: {
        totalTransactions: all.length,
        settledCount: settled.length,
        failedCount: failed.length,
        pendingCount: pending.length,
        totalUsdSent: parseFloat(totalUsdSent.toFixed(2)),
        totalInrDispatched: parseFloat(totalInrDispatched.toFixed(2)),
        platformWalletBalanceUsd: parseFloat(totalWalletBalance.toFixed(2)),
      },
      recentSettled: settled.slice(0, 10).map((t) => ({
        id: t.id,
        userEmail: t.user?.email,
        sourceAmount: Number(t.sourceAmount),
        destinationAmount: Number(t.destinationAmount),
        exchangeRate: Number(t.exchangeRate),
        externalReference: t.externalReference,
        settledAt: t.updatedAt,
      })),
    };
  }

  async reconcile() {
    const all = await this.transactionRepo.find();
    const discrepancies: { id: string; issue: string }[] = [];

    for (const tx of all) {
      const computed = parseFloat((Number(tx.sourceAmount) * Number(tx.exchangeRate)).toFixed(2));
      const stored = parseFloat(Number(tx.destinationAmount).toFixed(2));
      if (Math.abs(computed - stored) > 0.05) {
        discrepancies.push({
          id: tx.id,
          issue: `INR mismatch: stored=${stored}, computed=${computed}`,
        });
      }
      if (tx.status === TransactionStatus.SETTLED && !tx.externalReference) {
        discrepancies.push({
          id: tx.id,
          issue: 'SETTLED transaction missing external Nium reference',
        });
      }
    }

    return {
      checkedCount: all.length,
      discrepancyCount: discrepancies.length,
      discrepancies,
      status: discrepancies.length === 0 ? 'CLEAN' : 'DISCREPANCIES_FOUND',
    };
  }
}
