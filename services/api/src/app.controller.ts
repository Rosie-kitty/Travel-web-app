import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Убираем 'api' отсюда
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Делаем просто 'health'
  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }
}
