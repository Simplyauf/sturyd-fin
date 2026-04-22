import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { User } from '../entities/user.entity';
import { NiumService } from '../common/nium/nium.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletBalance)
    private walletRepository: Repository<WalletBalance>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private niumService: NiumService,
  ) {}

  async getOrCreate(user: User): Promise<WalletBalance> {
    let wallet = await this.walletRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!wallet) {
      wallet = this.walletRepository.create({ user, balanceUsd: 0 });
      wallet = await this.walletRepository.save(wallet);
    }

    // NEW: Sync live balance if customer exists on Nium
    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });
    if (fullUser?.niumCustomerHash) {
      try {
        const niumWallets = await this.niumService.getWalletDetails(fullUser.niumCustomerHash);
        if (niumWallets && niumWallets.length > 0) {
          const usdWallet = niumWallets.find(w => w.curSymbol === 'USD' || w.currency === 'USD');
          if (usdWallet) {
            wallet.balanceUsd = usdWallet.balance;
            await this.walletRepository.save(wallet);
          }
        }
      } catch (err) {
        console.error('[WalletService] Sync with Nium failed', err);
      }
    }

    return wallet;
  }

  async deposit(user: User, amountUsd: number): Promise<WalletBalance> {
    const wallet = await this.getOrCreate(user);
    
    // Sync with Nium Sandbox if user is verified
    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });
    if (fullUser?.niumCustomerHash) {
      try {
        const wallets = await this.niumService.getWalletDetails(fullUser.niumCustomerHash);
        if (wallets && wallets.length > 0) {
          await this.niumService.transferFromClientPool(
            fullUser.niumCustomerHash,
            wallets[0].walletHashId,
            amountUsd
          );
        }
      } catch (err) {
        console.error('[WalletService] Failed to sync deposit to Nium', err);
        // We continue anyway to update local balance for the demo
      }
    }

    wallet.balanceUsd = parseFloat(
      (Number(wallet.balanceUsd) + amountUsd).toFixed(2),
    );
    return this.walletRepository.save(wallet);
  }

  async deduct(user: User, amountUsd: number): Promise<WalletBalance> {
    const wallet = await this.getOrCreate(user);
    const current = Number(wallet.balanceUsd);
    if (current < amountUsd) {
      throw new Error('Insufficient wallet balance');
    }
    wallet.balanceUsd = parseFloat((current - amountUsd).toFixed(2));
    return this.walletRepository.save(wallet);
  }

  async getAllBalances(): Promise<WalletBalance[]> {
    return this.walletRepository.find({ relations: ['user'] });
  }
}
