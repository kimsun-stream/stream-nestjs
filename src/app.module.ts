import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import config from './common/config/config';
import { RedisModule } from './common/redis/redis.module';
import { ChatModule } from './chat/chat.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV == 'production' ? undefined : '.env',
      load: [config],
    }),
    RedisModule,
    PrismaModule,
    AuthModule,
    ChatModule,
    StreamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
