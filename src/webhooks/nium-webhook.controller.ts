import { Controller, Post, Get, Body, Headers, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { UsersService } from '../users/users.service';

@Controller('nium-webhook')
export class NiumWebhookController {
  private readonly logger = new Logger(NiumWebhookController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  healthCheck() {
    return { status: 'webhook listener is alive' };
  }

  @Post()
  async handleWebhook(@Body() payload: any, @Headers('x-request-id') requestId: string) {
    this.logger.log(`[Nium Webhook] Received event: ${payload.template} (RequestID: ${requestId})`);

    // Handle Wallet Funding (Customer Level)
    if (payload.template === 'CARD_WALLET_FUNDING_WEBHOOK' || payload.template === 'WALLET_FUNDING_WEBHOOK') {
      const customerHashId = payload.customerHashId;
      const amount = parseFloat(payload.transactionAmount);

      this.logger.log(`[Nium Webhook] Funding detected for customer ${customerHashId}: ${amount} ${payload.transactionCurrency}`);

      const user = await this.usersService.findByNiumHash(customerHashId);
      if (user) {
        await this.walletService.deposit(user, amount);
        this.logger.log(`[Nium Webhook] Local wallet updated for user ${user.email}`);
      } else {
        this.logger.warn(`[Nium Webhook] No local user found for hash ${customerHashId}`);
      }
    }

    // Handle Client Prefund Approval (Pool Level)
    if (payload.template === 'CARD_PRE_FUND_APPROVAL_WEBHOOK') {
      this.logger.log(`[Nium Webhook] Client Prefund APPROVED: ${payload.transactionAmount} ${payload.prefundCurrency} (Ref: ${payload.transactionId})`);
    }

    // Handle Declined Transfers
    if (payload.template === 'FUND_TRANSFER_DECLINED_BETWEEN_WALLETS_WEBHOOK' || payload.template === 'P2P_TRANSFER_DECLINED_WEBHOOK') {
      this.logger.error(`[Nium Webhook] TRANSFER DECLINED: ${payload.transactionAmount} ${payload.transactionCurrency} (Reason: ${payload.declineReason || 'Unknown'})`);
    }

    // Always return 200 OK to Nium to stop retries
    return { status: 'acknowledged' };
  }
}
