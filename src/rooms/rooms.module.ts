import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
  imports: [PrismaModule, RedisModule],
})
export class RoomsModule {}
