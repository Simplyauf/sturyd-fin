import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
  constructor(private beneficiariesService: BeneficiariesService) {}

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.beneficiariesService.create(req.user, body);
  }

  @Get()
  async findAll(@Request() req) {
    return this.beneficiariesService.findAll(req.user);
  }
}
