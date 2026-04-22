import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Post('kyc/verify')
  async verifyKyc(@Request() req, @Body() body: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    mobile: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    ssn: string;
    document?: string;
  }) {
    const user = await this.usersService.verifyKycReal(req.user.id, body);
    return {
      status: user.kycStatus,
      message: 'KYC onboarding completed successfully via Nium API',
      customerHash: user.niumCustomerHash
    };
  }

  // Admin: list all users
  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }

  // Admin: approve KYC for a specific user
  @Post(':id/kyc/approve')
  async approveKyc(@Param('id') id: string) {
    await this.usersService.updateKycStatus(id, 'VERIFIED');
    return { status: 'VERIFIED', message: `KYC approved for user ${id}` };
  }

  // Admin: reject KYC for a specific user
  @Post(':id/kyc/reject')
  async rejectKyc(@Param('id') id: string) {
    await this.usersService.updateKycStatus(id, 'REJECTED');
    return { status: 'REJECTED', message: `KYC rejected for user ${id}` };
  }
}
