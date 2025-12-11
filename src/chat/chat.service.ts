import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetMessagesDto, SendMessageDto } from './dto/message.dto';
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

  async sendMessage(dto: SendMessageDto, client: Socket) {
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

  async getMessages(dto: GetMessagesDto) {
    const { roomId, limit, cursor } = dto;

    const redisString = await this.redis.lrange(`chat:history:${roomId}`, 0, -1);

    if (!cursor) {
      const dto = GetMessagesDto.create({ roomId, limit, cursor: new Date() });
      return await this.getMessages(dto);
    }

    // const redisMessages = redisString
    //   .map((msg) => {
    //     const parsedMsg: Chat = JSON.parse(msg);
    //     parsedMsg.createdAt < cursor ? parsedMsg : ;
    //   })
    //   .reverse();

    const redisMessages = redisString
      .map((msg) => JSON.parse(msg) as Chat)
      .filter((msg) => msg.createdAt < cursor)
      .reverse();

    let dbMessages: Chat[] = [];
    const need = limit - redisMessages.length;

    console.log(need);

    if (need > 0) {
      dbMessages = await this.prisma.chat.findMany({
        where: { roomId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: need,
      });
    }

    const messages = [...dbMessages, ...redisMessages];

    return { messages, cursor: messages[messages.length - 1].createdAt };
  }
}
