import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import type { NiumWebhookPayload } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  /**
   * Mocked Nium webhook endpoint.
   * In production, Nium would POST here with HMAC signature verification.
   */
  @Post('nium')
  async handleNiumWebhook(@Body() payload: NiumWebhookPayload) {
    return this.webhooksService.handleNiumWebhook(payload);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getLogs() {
    return this.webhooksService.getLogs();
  }
}
