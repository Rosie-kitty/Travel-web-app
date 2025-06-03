// src/auth/strategies/vk.strategy.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-vkontakte';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VkStrategy extends PassportStrategy(Strategy, 'vk') {
  constructor(configService: ConfigService) {
    // Получаем каждую переменную и явно проверяем, что она есть
    const clientID = configService.get<string>('VK_CLIENT_ID');
    const clientSecret = configService.get<string>('VK_CLIENT_SECRET');
    const callbackURL = configService.get<string>('VK_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new InternalServerErrorException(
        'VK_CLIENT_ID, VK_CLIENT_SECRET и VK_CALLBACK_URL должны быть заданы',
      );
    }

    super(<StrategyOptions>{
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    params: any,
    profile: any,
    done: Function,
  ) {
    const { id, displayName, emails } = profile;
    const user = {
      vkId: id,
      name: displayName,
      email: emails?.[0]?.value || null,
    };
    done(null, user);
  }
}
