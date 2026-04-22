import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  async getBalance(@Request() req) {
    return this.walletService.getOrCreate(req.user);
  }

  @Post('deposit')
  async deposit(@Request() req, @Body() body: { amountUsd: number }) {
    return this.walletService.deposit(req.user, body.amountUsd);
  }
}
