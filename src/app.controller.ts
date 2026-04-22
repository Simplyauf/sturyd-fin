import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { NiumService } from './common/nium/nium.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly niumService: NiumService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('nium-test')
  async testNium() {
    try {
      const details = await this.niumService.testConnection();
      return { status: 'SUCCESS', details };
    } catch (err) {
      return { status: 'FAILED', error: err.message, help: 'Check your IP allowlist in the Nium Portal' };
    }
  }
}
