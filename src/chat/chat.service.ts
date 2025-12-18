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
    const { token, streamId, message } = dto;

    const result = await this.authService.isValidToken(token);
    if (!result) return client.emit('Invalid token');

    const len = await this.redis.llen(`chat:history:${streamId}`);

    const msg = {
      message,
      streamId,
      userId: result.userId,
      username: result.username,
      createdAt: new Date(),
    };

    if (len >= 100) {
      const jsonStringMessages = await this.redis.lrange(`chat:history:${streamId}`, 0, -1);
      const messages = jsonStringMessages.map((msg) => JSON.parse(msg));

      await this.redis.del(`chat:history:${streamId}`);

      await this.prisma.chat.createMany({
        data: messages,
      });
    } else {
      await this.redis.lpush(`chat:history:${streamId}`, JSON.stringify(msg));
    }
    return msg;
  }

  async getMessages(dto: GetMessagesDto): Promise<{ messages: Chat[]; nextCursor: Date | null }> {
    const { streamId, limit, nextCursor } = dto;

    const redisString = await this.redis.lrange(`chat:history:${streamId}`, 0, -1);

    let redisMessages = redisString
      .map((msg) => JSON.parse(msg) as Chat)
      .filter((msg) => new Date(msg.createdAt) < new Date(nextCursor));
    let dbMessages: Chat[] = [];
    const need = limit - redisMessages.length;

    if (need > 0) {
      dbMessages = await this.prisma.chat.findMany({
        where: { stream_id: streamId, createdAt: { lt: nextCursor } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: need + 1,
      });
    } else if (need < 0) {
      redisMessages = redisMessages.slice(0, limit - 1);
    }

    const messages = [...redisMessages, ...dbMessages];

    const resNextCursor = messages[messages.length - 1].createdAt
      ? messages[messages.length - 1].createdAt
      : null;

    messages.slice(0, messages.length - 1);

    return { messages, nextCursor: resNextCursor };
  }
}
