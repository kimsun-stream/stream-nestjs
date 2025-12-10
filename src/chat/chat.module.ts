import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
