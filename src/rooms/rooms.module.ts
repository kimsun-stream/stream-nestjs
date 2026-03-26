import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
  imports: [PrismaModule, RedisModule, AuthModule],
})
export class RoomsModule {}
