import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLog } from '../entities/webhook-log.entity';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';

export interface NiumWebhookPayload {
  template?: string; // Nium uses 'template'
  type?: string;     // Compliance uses 'type'
  value?: string;    // Compliance uses 'value'
  externalId?: string;
  systemReferenceNumber?: string;
  customerHashId?: string;
  transactionAmount?: string;
  currency?: string;
  [key: string]: any;
}

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async handleNiumWebhook(payload: NiumWebhookPayload) {
    // Determine the event identifier from Nium
    const eventName = payload.template || payload.type || 'UNKNOWN';
    
    // Log the webhook
    const log = this.webhookLogRepository.create({
      event: eventName,
      transactionId: payload.externalId || payload.value || 'N/A',
      payload: JSON.stringify(payload),
    });

    if (!payload.externalId && !payload.value) {
      log.processedAt = new Date();
      await this.webhookLogRepository.save(log);
      return { received: true, ignored: true, reason: 'No externalId or value' };
    }

    // Attempt to find the transaction via externalId (which we use as our DB id by mapping it when creating transactions)
    // Or value if it is a compliance callback
    const searchId = payload.externalId || payload.value;
    const transaction = await this.transactionRepository.findOne({
      where: { id: searchId },
    });

    if (!transaction) {
      log.processedAt = new Date();
      await this.webhookLogRepository.save(log);
      throw new NotFoundException(`Transaction ${searchId} not found`);
    }

    // Process Nium specific webhook templates
    switch (eventName) {
      case 'TRANSACTION': // Nium compliance nudge
        // Not used explicitly in our simple state machine, but we can log it
        break;
        
      case 'REMIT_TRANSACTION_INITIATED_WEBHOOK':
        if (transaction.status !== TransactionStatus.AWAITING_PAYMENT) {
          throw new BadRequestException('Transaction not in AWAITING_PAYMENT state');
        }
        transaction.status = TransactionStatus.PAYIN_COMPLETED;
        if (payload.systemReferenceNumber) {
          transaction.externalReference = payload.systemReferenceNumber;
        }
        break;

      case 'REMIT_TRANSACTION_PAID': // Assuming similar payload pattern for completion
        if (transaction.status !== TransactionStatus.PAYIN_COMPLETED &&
            transaction.status !== TransactionStatus.PAYOUT_INITIATED) {
          throw new BadRequestException('Transaction not in a valid state for settlement');
        }
        transaction.status = TransactionStatus.SETTLED;
        break;

      case 'REMIT_TRANSACTION_EXPIRED_WEBHOOK':
      case 'REMIT_TRANSACTION_RETURNED_WEBHOOK':
        transaction.status = TransactionStatus.FAILED;
        break;
    }

    await this.transactionRepository.save(transaction);

    log.processedAt = new Date();
    await this.webhookLogRepository.save(log);

    return { received: true, event: eventName, newStatus: transaction.status };
  }

  async getLogs(): Promise<WebhookLog[]> {
    return this.webhookLogRepository.find({ order: { createdAt: 'DESC' } });
  }
}
