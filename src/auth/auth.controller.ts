import { Controller, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseResponse } from 'src/common/dto/base-response';
import { ExampleDto } from './dto/example.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get(':id')
  async get(@Param() dto: ExampleDto) {
    return BaseResponse.success(await this.authService.get(dto.id), 'users found');
  }
}
