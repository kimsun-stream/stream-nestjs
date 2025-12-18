import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStreamDto, GetStreamsDto, UpdateStreamDto } from './dto/stream.dto';

@Injectable()
export class StreamService {
  constructor(private readonly prisma: PrismaService) {}

  async getStream(streamId: number) {
    const stream = await this.prisma.streams.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('방송을 찾을 수 없습니다.');
    return stream;
  }

  async getStreams(query: GetStreamsDto) {
    const { limit, cursor } = query;
    const streams = await this.prisma.streams.findMany({
      where: { id: { gt: cursor }, is_live: true },
      take: limit + 1,
      orderBy: { created_at: 'desc' },
    });
    const nextCursor = streams[limit] ?? null;

    return { streams, nextCursor };
  }

  async createStream(dto: CreateStreamDto, userId: number) {
    const { title, description } = dto;

    const stream = await this.prisma.streams.findMany({
      where: { user_id: userId, is_live: true },
    });
    if (stream.length) throw new ConflictException('라이브 중인 방송이 존재합니다.');

    const result = await this.prisma.streams.create({
      data: { title, description, user_id: userId },
    });

    return result;
  }

  async startStream(streamId: number, userId: number) {
    const stream = await this.prisma.streams.findUnique({
      where: { user_id: userId, id: streamId },
      select: { is_live: true },
    });
    if (!stream) throw new NotFoundException('방송이 존재하지 않습니다.');
    if (stream.is_live) throw new ConflictException('이미 시작된 방송입니다.');

    await this.prisma.streams.update({
      where: { id: streamId, user_id: userId },
      data: { is_live: true },
    });

    return;
  }

  async stopStream(streamId: number, userId: number) {
    const stream = await this.prisma.streams.findUnique({
      where: { user_id: userId, id: streamId },
      select: { is_live: true },
    });
    if (!stream) throw new NotFoundException('방송이 존재하지 않습니다.');
    if (!stream.is_live) throw new ConflictException('이미 종료된 방송입니다.');

    await this.prisma.streams.update({
      where: { id: streamId, user_id: userId },
      data: { is_live: false },
    });

    return;
  }

  async updateStream(streamId: number, userId: number, dto: UpdateStreamDto) {
    const stream = await this.prisma.streams.findUnique({
      where: { id: streamId, user_id: userId },
    });
    if (!stream) throw new NotFoundException('방송이 존재하지 않습니다.');

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
    if (!stream) throw new NotFoundException('방송이 존재하지 않습니다.');

    await this.prisma.streams.delete({ where: { id: streamId, user_id: userId } });

    return;
  }
}
