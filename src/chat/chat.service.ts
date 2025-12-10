import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageDto } from './dto/message.dto';
import { AuthService } from 'src/auth/auth.service';
import z from 'zod';
import { Socket } from 'socket.io';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async sendMessage(dto: MessageDto, client: Socket) {
    const { token, roomId, message } = dto;
    if (!token) return client.emit('No token');

    const result = await this.authService.isValidToken(token);
    if (!result) return client.emit('Invalid token');

    return this.prisma.chat.create({
      data: {
        userId: result.userId,
        roomId,
        message,
        username: result.username,
        createdAt: new Date(),
      },
    });
  }
}
