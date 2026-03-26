import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { FindAllRoomDto } from './dto/find-room.dto';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class RoomsService {
  private readonly axumServerUrl: string;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.axumServerUrl = this.configService.getOrThrow('AXUM_SERVER_URL');
  }

  async findAll(q: FindAllRoomDto) {
    const { page, limit, sort, isLive } = q;

    const sRoomIds = await this.redis.smembers('live_rooms');
    const liveRoomIds = sRoomIds.map((id) => Number(id));

    const where = isLive ? { id: { in: liveRoomIds } } : {};

    const rooms = await this.prisma.rooms.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: sort === 'recent' ? 'asc' : 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return rooms;
  }

  async findOne(id: number) {
    const room = await this.prisma.rooms.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, username: true, email: true },
        },
      },
    });
    if (!room) throw new NotFoundException('존재하지 않는 방송입니다.');
    return room;
  }

  async create(userId: number, dto: CreateRoomDto) {
    const { title, description } = dto;
    const created_at = new Date();

    const isLive = await this.redis.get(`streamer:${userId}`);
    if (isLive) {
      throw new ConflictException('이미 방송 중입니다.');
    }

    const hasNotStartedRoom = await this.prisma.rooms.findFirst({
      where: { user_id: userId, ended_at: null },
      select: { id: true },
    });
    if (hasNotStartedRoom) {
      throw new ConflictException('스트림 세션을 시작하지 않은 방송이 존재합니다.');
    }

    const room = await this.prisma.rooms.create({
      data: { title, description, created_at, user_id: userId },
    });

    const res = await fetch(`${this.axumServerUrl}/room/${room.id}`, {
      method: 'POST',
    });
    if (!res.ok) {
      await this.prisma.rooms.delete({ where: { id: room.id } });
      throw new InternalServerErrorException('스트리밍 서버 생성 실패');
    }

    return { roomId: room.id };
  }

  async update(userId: number, id: number, dto: UpdateRoomDto) {
    const room = await this.prisma.rooms.findFirst({
      where: { id, user_id: userId },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('존재하지 않는 방송입니다.');

    return this.prisma.rooms.update({
      where: { id },
      data: dto,
    });
  }

  async startStream(userId: number) {
    const room = await this.prisma.rooms.findFirst({
      where: { user_id: userId, ended_at: null },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('방송이 존재하지 않습니다.');

    const roomId = room.id;

    await this.redis.sadd('live_rooms', roomId);
    await this.redis.set(`streamer:${userId}`, roomId);

    const res = await fetch(`${this.axumServerUrl}/room/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'live' }),
    });
    if (!res.ok) {
      await this.redis.srem('live_rooms', roomId);
      await this.redis.del(`streamer:${userId}`);
      throw new InternalServerErrorException('스트리밍 서버 공개 전환 실패');
    }

    return;
  }

  async endStream(refreshToken: string) {
    console.log(refreshToken);
    const payload = await this.authService.isValidRefreshToken(refreshToken);

    const { userId } = payload;

    const room = await this.prisma.rooms.findFirst({
      where: { user_id: userId, ended_at: null },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('방송이 존재하지 않습니다.');

    const roomId = room.id;

    const res = await fetch(`${this.axumServerUrl}/room/${roomId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new InternalServerErrorException('스트리밍 서버 삭제 실패');

    await this.redis.srem('live_rooms', roomId);
    await this.redis.del(`streamer:${userId}`);
    await this.prisma.rooms.update({ where: { id: roomId }, data: { ended_at: new Date() } });

    return;
  }

  async deleteRoom(userId: number, roomId: number) {
    const roomExists = await this.prisma.rooms.findFirst({
      where: { id: roomId, user_id: userId },
    });
    if (!roomExists) throw new NotFoundException('존재하지 않는 방송입니다.');

    await this.prisma.rooms.delete({ where: { id: roomId }, select: { id: true } });
    await this.redis.srem('live_rooms', roomId);
    await this.redis.del(`streamer:${userId}`);

    return;
  }
}
