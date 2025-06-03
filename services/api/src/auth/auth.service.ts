import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { Role } from '../entities/role.entity';
import { Redis } from 'ioredis';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>, // уже добавленный

    private readonly jwtService: JwtService,

    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,

    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1) Убедимся, что пользователя с таким email нет
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2) Хешируем пароль
    const hashed = await bcrypt.hash(dto.password, 10);

    // 3) Пытаемся найти роль по имени (dto.role)
    const roleEntity = await this.roleRepo.findOne({
      where: { name: dto.role }, // предполагаем, что в Role есть поле 'name'
    });
    if (!roleEntity) {
      throw new BadRequestException(`Role "${dto.role}" not found`);
    }

    // 4) Создаём пользователя, передавая связку role как объект { id: number }
    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      role: { id: roleEntity.id }, // <- здесь важно передать именно { id: ... }
    });

    return this.userRepo.save(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    // Создаём сессию в БД и Redis (JWT будем хранить в Redis с TTL)
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    // Сохраняем токен в БД (Session) и кэшируем в Redis
    const session = this.sessionRepo.create({ token, user });
    await this.sessionRepo.save(session);
    await this.redisClient.set(`sess:${token}`, user.id.toString(), 'EX', 3600); // 1 час
    return { access_token: token };
  }

  async logout(token: string) {
    // Помечаем в БД сессию неактивной и удаляем из Redis
    await this.sessionRepo.update({ token }, { isActive: false });
    await this.redisClient.del(`sess:${token}`);
  }

  async validateJwtPayload(payload: { sub: number; email: string }) {
    // Проверяем, есть ли сессия в Redis
    const exists = await this.redisClient.get(`sess:${payload['token']}`);
    if (!exists) throw new UnauthorizedException('Session expired');
    return this.userRepo.findOne({ where: { id: payload.sub } });
  }
  async changePassword(userId: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update({ id: userId }, { password: hashed });
    // Удаляем все активные сессии юзера:
    const sessions = await this.sessionRepo.find({ where: { user: { id: userId }, isActive: true } });
    for (const s of sessions) {
      await this.redisClient.del(`sess:${s.token}`);
      s.isActive = false;
      await this.sessionRepo.save(s);
    }
  }  
}
