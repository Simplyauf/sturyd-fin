import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get('quote')
  async getQuote(@Request() req) {
    return this.transactionsService.createQuote(req.user.id);
  }

  @Post('initiate')
  async initiate(@Request() req, @Body() body: { beneficiaryId: string, amountUsd: number }) {
    return this.transactionsService.initiateTransfer(req.user, body.beneficiaryId, body.amountUsd);
  }

  @Post('simulate-success/:id')
  async simulateSuccess(@Param('id') id: string) {
    return this.transactionsService.simulatePaymentSuccess(id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.transactionsService.findAll(req.user);
  }

  // Admin: all transactions across all users
  @Get('all')
  async findAllGlobal() {
    return this.transactionsService.findAllGlobal();
  }
}
