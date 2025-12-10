import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageDto } from './dto/message.dto';
import { AuthService } from 'src/auth/auth.service';
import z from 'zod';
import { Socket } from 'socket.io';
import { RedisService } from 'src/common/redis/redis.service';
import { iif } from 'rxjs';
import { Chat } from 'src/prisma/generated/prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authService: AuthService,
  ) {}

  async sendMessage(dto: MessageDto, client: Socket) {
    const { token, roomId, message } = dto;
    if (!token) return client.emit('No token');

    const result = await this.authService.isValidToken(token);
    if (!result) return client.emit('Invalid token');

    const len = await this.redis.llen(`chat:history:${roomId}`);

    const msg = {
      message,
      roomId,
      userId: result.userId,
      username: result.username,
      createdAt: new Date(),
    };

    if (len >= 100) {
      const jsonStringMessages = await this.redis.lrange(`chat:history:${roomId}`, 0, -1);
      const messages = jsonStringMessages.map((msg) => JSON.parse(msg));

      await this.redis.del(`chat:history:${roomId}`);

      await this.prisma.chat.createMany({
        data: messages,
      });
    } else {
      await this.redis.lpush(`chat:history:${roomId}`, JSON.stringify(msg));
    }

    return msg;
  }

  async getMessages(roomId: string, page: number, limit: number) {
    const len = await this.redis.llen(`chat:history:${roomId}`);
    if (!len) {
      return await this.prisma.chat.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      });
    }

    const jsonStringMessages = await this.redis.lrange(
      `chat:history:${roomId}`,
      page * limit - limit,
      page * limit,
    );

    const take = page * limit - 100 > 0 ? page * limit - 100 : 0;

    const messages1 = jsonStringMessages.map((msg) => JSON.parse(msg));
    const messages2 = await this.prisma.chat.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const messages = messages1.reverse().concat(messages2);

    return messages;
  }
}
