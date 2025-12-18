import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStreamDto, GetStreamsDto, UpdateStreamDto } from './dto/request/stream.dto';
import { StreamStatus } from './dto/stream-status';

@Injectable()
export class StreamService {
  constructor(private readonly prisma: PrismaService) {}

  async getStream(streamId: number) {
    return await this.prisma.streams.findUnique({ where: { id: streamId } });
  }

  async getStreams(query: GetStreamsDto) {
    const { limit, cursor } = query;

    const streams = await this.prisma.streams.findMany({
      where: { id: { gt: cursor } },
      take: limit + 1,
    });
    const nextCursor = streams[streams.length];

    return { streams, nextCursor };
  }

  async createStream(dto: CreateStreamDto, userId: number) {
    const { title, description } = dto;

    const stream = await this.prisma.streams.findMany({
      where: { user_id: userId, status: StreamStatus.Online },
    });
    if (stream) throw new ConflictException('온라인인 방이 존재합니다.');

    const result = await this.prisma.streams.create({
      data: { title, description, user_id: userId },
    });

    return result;
  }

  async updateStream(streamId: number, userId: number, dto: UpdateStreamDto) {
    const stream = await this.prisma.streams.findUnique({
      where: { id: streamId, user_id: userId },
    });
    if (!stream) throw new NotFoundException('존재하지 않습니다.');

    await this.prisma.streams.update({
      where: { id: streamId, user_id: userId },
      data: dto,
    });

    return;
  }

  async deleteStream(streamId: number, userId: number) {
    const stream = await this.prisma.streams.findUnique({
      where: { id: streamId, user_id: userId },
    });
    if (!stream) throw new NotFoundException('존재하지 않습니다.');

    await this.prisma.streams.delete({ where: { id: streamId, user_id: userId } });

    return;
  }
}
