import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/request/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/request/login.dto';
import { Response } from 'express';
import z from 'zod';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    const { username, email, password } = dto;
    const hashedPassword = await this.hashPassword(password);
    await this.prisma.user.create({ data: { email, username, password: hashedPassword } });
  }

  async login(dto: LoginDto, res: Response): Promise<{ accessToken: string }> {
    const { email, password } = dto;
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
      select: { id: true, password: true, username: true },
    });

    await this.comparePassword(password, user.password);

    const payload = { userId: user.id, username: user.username };
    const accessToken = await this.jwtService.sign(payload, { expiresIn: '10m' });
    const newUuid = crypto.randomUUID();

    const oldUuid = await this.redis.get(`user_refresh:${user.id}`);
    if (oldUuid) {
      await this.redis.del(`refresh:${oldUuid}`);
    }

    const THIRTY_DAYS_IN_S = 30 * 24 * 60 * 60;

    await Promise.all([
      this.redis.setex(`refresh:${newUuid}`, THIRTY_DAYS_IN_S, user.id.toString()),
      this.redis.setex(`user_refresh:${user.id}`, THIRTY_DAYS_IN_S, newUuid),
    ]);

    res.cookie('refreshToken', newUuid, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: THIRTY_DAYS_IN_S * 1000,
    });

    return { accessToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const userId = await this.redis.get(`refresh:${refreshToken}`);
    if (!userId) throw new UnauthorizedException('Invalid token');

    const parsedUserId = z.coerce.number().parse(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: parsedUserId },
      select: { username: true },
    });
    if (!user) throw new UnauthorizedException('Invalid token');

    const payload = { userId: parsedUserId, username: user.username };
    const accessToken = await this.jwtService.sign(payload, { expiresIn: '10m' });

    return { accessToken };
  }

  async logout(userId: number, res: Response): Promise<void> {
    const uuid = await this.redis.get(`user_refresh:${userId}`);
    if (!uuid) return;

    await Promise.all([
      this.redis.del(`refresh:${uuid}`),
      this.redis.del(`user_refresh:${userId}`),
    ]);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    return;
  }

  async isValidToken(token: string): Promise<{ userId: number; username: string } | null> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (e) {
      console.log(e.__proto__);
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, encrypted: string): Promise<void> {
    const match = await bcrypt.compare(password, encrypted);
    if (!match) throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    return;
  }
}
