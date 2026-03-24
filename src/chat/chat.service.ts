import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetMessagesDto, SendMessageDto } from './dto/message.dto';
import { AuthService } from 'src/auth/auth.service';
import { Socket } from 'socket.io';
import { RedisService } from 'src/common/redis/redis.service';
import { Chat } from 'src/prisma/generated/prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authService: AuthService,
  ) {}

  async sendMessage(dto: SendMessageDto, client: Socket) {
    const { token, roomId, message } = dto;

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

  async getMessages(dto: GetMessagesDto): Promise<{ messages: Chat[]; nextCursor: Date | null }> {
    const { roomId, limit, nextCursor } = dto;

    const redisString = await this.redis.lrange(`chat:history:${roomId}`, 0, -1);

    let redisMessages = redisString
      .map((msg) => JSON.parse(msg) as Chat)
      .filter((msg) => new Date(msg.created_at) < new Date(nextCursor));
    let dbMessages: Chat[] = [];
    const need = limit - redisMessages.length;

    if (need > 0) {
      dbMessages = await this.prisma.chat.findMany({
        where: { room_id: +roomId, created_at: { lt: nextCursor } },
        orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
        take: need + 1,
      });
    } else if (need < 0) {
      redisMessages = redisMessages.slice(0, limit - 1);
    }

    const messages = [...redisMessages, ...dbMessages];

    const resNextCursor = messages[messages.length - 1].created_at
      ? messages[messages.length - 1].created_at
      : null;

    messages.slice(0, messages.length - 1);

    return { messages, nextCursor: resNextCursor };
  }
}
