import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string } {
    // Любое простое «здоровье» — здесь возвращаем JSON { status: 'ok' }
    return { status: 'ok' };
  }
}
