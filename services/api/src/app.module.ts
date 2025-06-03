// services/api/src/app.module.ts

import * as nodeCrypto from 'crypto';
if (!(global as any).crypto) {
  (global as any).crypto = {
    randomUUID: () => nodeCrypto.randomUUID(),
  };
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: true, // ← включаем автоматический запуск миграций
        logging: true,
      }),
    }),
    AuthModule,
    // … сюда добавьте другие модули (AuthModule, TripModule и т.д.)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
