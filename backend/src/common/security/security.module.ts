import { Global, Module } from '@nestjs/common';
import { AdminKeyGuard } from './admin-key.guard';
import { AntiSpamService } from './anti-spam.service';
import { CaptchaController } from './captcha.controller';
import { CaptchaService } from './captcha.service';

@Global()
@Module({
  controllers: [CaptchaController],
  providers: [AntiSpamService, AdminKeyGuard, CaptchaService],
  exports: [AntiSpamService, AdminKeyGuard, CaptchaService],
})
export class SecurityModule {}
