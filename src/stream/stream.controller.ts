import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StreamService } from './stream.service';
import { BaseResponse } from 'src/common/dto/base-response';
import { CreateStreamDto, GetStreamsDto, UpdateStreamDto } from './dto/request/stream.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UserId } from 'src/common/decorators/user-id.decorator';

@Controller('streams')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get()
  async getStreams(@Query() query: GetStreamsDto) {
    const result = await this.streamService.getStreams(query);
    return BaseResponse.success(result, '스트림 조회에 성공했습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createStream(@Body() dto: CreateStreamDto, @UserId() userId: number) {
    const result = await this.streamService.createStream(dto, userId);
    return BaseResponse.success(result, '스트림 생성에 성공했습니다.');
  }

  @Get(':id')
  async getStream(@Param('id', ParseIntPipe) id: number) {
    const result = await this.streamService.getStream(id);
    return BaseResponse.success(result, '스트림 조회에 성공했습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateStream(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() dto: UpdateStreamDto,
  ) {
    const result = await this.streamService.updateStream(id, userId, dto);
    return BaseResponse.success(result, '스트림 수정에 성공했습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStream(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    const result = await this.streamService.deleteStream(id, userId);
    return BaseResponse.success(result, '스트림 삭제에 성공했습니다.');
  }
}
