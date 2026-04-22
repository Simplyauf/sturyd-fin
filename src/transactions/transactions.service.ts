import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { BeneficiariesService } from '../beneficiaries/beneficiaries.service';
import { NiumService } from '../common/nium/nium.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private beneficiariesService: BeneficiariesService,
    private niumService: NiumService,
  ) {}

  private async getLiveRate(): Promise<number> {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
    const data = await res.json();
    return data.rates.INR;
  }

  async createQuote(userId: string) {
    const exchangeRate = await this.getLiveRate();
    return {
      sourceCurrency: 'USD',
      destinationCurrency: 'INR',
      exchangeRate,
    };
  }

  async initiateTransfer(user: User, beneficiaryId: string, amountUsd: number) {
    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!fullUser) throw new NotFoundException('User not found');

    const beneficiary = await this.beneficiariesService.findOne(beneficiaryId, fullUser);
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    // 1. Get live FX rate
    const exchangeRate = await this.getLiveRate();
    const destinationAmount = amountUsd * exchangeRate;

    // 2. Create local transaction record
    const transaction = this.transactionsRepository.create({
      user: fullUser,
      beneficiary,
      sourceAmount: amountUsd,
      destinationAmount,
      exchangeRate,
      status: TransactionStatus.AWAITING_PAYMENT,
    });

    const savedTx = await this.transactionsRepository.save(transaction);

    // 3. Fetch real Pay-in/VRA details from Nium for instructions
    let paymentInstructions = 'Please complete your KYC to receive deposit instructions.';
    if (fullUser.niumCustomerHash) {
      try {
        const wallets = await this.niumService.getWalletDetails(fullUser.niumCustomerHash);
        if (wallets && wallets.length > 0) {
          const wallet = wallets[0];
          paymentInstructions = `Transfer ${amountUsd} USD to Nium Wallet: ${wallet.walletHashId}. 
          Account Number: ${wallet.accountNumber || 'N/A'}`;
        }
      } catch (err) {
        paymentInstructions = 'Transfer instructions temporarily unavailable. Please try again later.';
      }
    }

    return {
      transactionId: savedTx.id,
      amountUsd,
      amountInr: destinationAmount,
      exchangeRate,
      paymentInstructions,
      status: savedTx.status,
    };
  }

  /**
   * Simulates the "Webhook" from the payment provider.
   * In a real flow, this is triggered by a Pay-in webhook from Nium.
   */
  async simulatePaymentSuccess(transactionId: string) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'beneficiary'],
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('Transaction already processed or in invalid state');
    }

    const user = transaction.user;
    if (!user.niumCustomerHash) {
      throw new BadRequestException('Customer KYC must be completed on Nium before payment simulation');
    }

    // 1. Mark Pay-in as completed (Our system state)
    transaction.status = TransactionStatus.PAYIN_COMPLETED;
    await this.transactionsRepository.save(transaction);

    // 2. Trigger REAL Payout via Nium
    transaction.status = TransactionStatus.PAYOUT_INITIATED;
    
    // Get wallet details for the customer
    const wallets = await this.niumService.getWalletDetails(user.niumCustomerHash);
    if (!wallets || wallets.length === 0) throw new BadRequestException('No wallet found for Nium customer');
    const walletHashId = wallets[0].walletHashId;

    // Initiate real transfer
    const payoutHashId = transaction.beneficiary.niumPayoutHash;
    if (!payoutHashId) {
      throw new BadRequestException('Beneficiary has not been synced to Nium. Please re-add the beneficiary after completing KYC.');
    }

    const niumTransfer = await this.niumService.initiateTransfer(
      user.niumCustomerHash,
      walletHashId,
      transaction.beneficiary.niumBeneficiaryHash || transaction.beneficiary.id,
      payoutHashId,
      transaction.sourceAmount,
      transaction.destinationCurrency
    );

    // Nium returns system_reference_number (snake_case) in the remittance response
    transaction.externalReference = niumTransfer.system_reference_number || niumTransfer.systemReferenceNumber;
    await this.transactionsRepository.save(transaction);

    // 3. Mark as Settled (In sandbox, we can assume it settles or wait for webhook)
    transaction.status = TransactionStatus.SETTLED;
    return this.transactionsRepository.save(transaction);
  }

  async findAll(user: User) {
    return this.transactionsRepository.find({
      where: { user: { id: user.id } },
      relations: ['beneficiary'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllGlobal() {
    return this.transactionsRepository.find({
      relations: ['user', 'beneficiary'],
      order: { createdAt: 'DESC' },
    });
  }
}

