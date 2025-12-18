import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StreamService],
  controllers: [StreamController],
})
export class StreamModule {}
