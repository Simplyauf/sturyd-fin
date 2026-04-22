import { Module } from '@nestjs/common';
import { NiumWebhookController } from './nium-webhook.controller';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [UsersModule, WalletModule],
  controllers: [NiumWebhookController],
})
export class WebhooksModule {}
