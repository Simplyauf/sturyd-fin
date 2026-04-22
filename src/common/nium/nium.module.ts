import { Module, Global } from '@nestjs/common';
import { NiumService } from './nium.service';

@Global()
@Module({
  providers: [NiumService],
  exports: [NiumService],
})
export class NiumModule {}
