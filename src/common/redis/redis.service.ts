import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis {
  constructor(private readonly configService: ConfigService) {
    super({
      host: configService.getOrThrow('REDIS_HOST'),
      port: configService.getOrThrow('REDIS_PORT'),
      password: configService.getOrThrow('REDIS_PASSWORD'),
    });
    this.on('connect', () => console.log('Redis connected'));
    this.on('error', (err) => console.error('Redis error:', err));
  }
}
