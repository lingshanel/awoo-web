import { Global, Module } from '@nestjs/common';
import { AdminKeyGuard } from './admin-key.guard';
import { AntiSpamService } from './anti-spam.service';

@Global()
@Module({
  providers: [AntiSpamService, AdminKeyGuard],
  exports: [AntiSpamService, AdminKeyGuard],
})
export class SecurityModule {}
