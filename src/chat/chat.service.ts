import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageDto } from './dto/message.dto';
import { AuthService } from 'src/auth/auth.service';
import z from 'zod';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async sendMessage(dto: MessageDto) {
    const { token, roomId, message } = dto;
    if (!token) throw new UnauthorizedException('No token');

    const result = await this.authService.isValidToken(token);
    if (!result) throw new UnauthorizedException('Invalid token');

    return this.prisma.chat.create({
      data: { userId: result.userId, roomId, message },
    });
  }
}
