import { Controller, Get, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Get('summary')
  async getSummary() {
    return this.ledgerService.getPlatformSummary();
  }

  @Get('reconcile')
  async reconcile() {
    return this.ledgerService.reconcile();
  }
}
