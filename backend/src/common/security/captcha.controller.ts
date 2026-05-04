import { Controller, Get } from '@nestjs/common';
import { CaptchaService } from './captcha.service';

@Controller('security/captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  createChallenge() {
    return this.captchaService.createChallenge();
  }
}
