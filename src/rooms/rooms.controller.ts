import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UserId } from 'src/common/decorators/user-id.decorator';
import { FindAllRoomDto } from './dto/find-room.dto';
import { BaseResponse } from 'src/common/dto/base-response';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateRoomDto, @UserId() userId: number) {
    const data = await this.roomsService.create(userId, dto);
    return BaseResponse.success(data, '성공적으로 생성되었습니다.');
  }

  @Get()
  async findAll(@Query() q: FindAllRoomDto) {
    const data = await this.roomsService.findAll(q);
    return BaseResponse.success(data, '성공적으로 조회되었습니다.');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.roomsService.findOne(+id);
    return BaseResponse.success(data, '성공적으로 조회되었습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @UserId() userId: number, @Body() dto: UpdateRoomDto) {
    const data = await this.roomsService.update(userId, +id, dto);
    return BaseResponse.success(data, '성공적으로 수정되었습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async startStream(@UserId() userId: number) {
    const data = await this.roomsService.startStream(userId);
    return BaseResponse.success(data, '성공적으로 시작되었습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Post('end')
  async endStream(@UserId() userId: number) {
    const data = await this.roomsService.endStream(userId);
    return BaseResponse.success(data, '성공적으로 삭제되었습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteRoom(@Param('id') id: string, @UserId() userId: number) {
    await this.roomsService.deleteRoom(userId, +id);
    return BaseResponse.success(null, '성공적으로 삭제되었습니다.');
  }
}
