import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: process.env.APP_NAME ?? 'awoo',
      timestamp: new Date().toISOString(),
    };
  }
}
