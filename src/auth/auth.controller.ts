import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseResponse } from 'src/common/dto/base-response';
import { ExampleDto } from './dto/example.dto';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';
import { response, Response } from 'express';
import { RefreshToken } from 'src/common/decorators/refresh.decorator';
import { UserId } from 'src/common/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<BaseResponse> {
    const result = await this.authService.register(dto);
    return BaseResponse.success(result, '회원가입에 성공했습니다.');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BaseResponse> {
    const result = await this.authService.login(dto, res);
    return BaseResponse.success(result, '로그인에 성공했습니다.');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@RefreshToken() refreshToken: string) {
    const result = await this.authService.refresh(refreshToken);
    return BaseResponse.success(result, '액세스 토큰 재발급에 성공했습니다.');
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@UserId() userId: number, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(userId, res);
    return BaseResponse.success(result, '로그아웃에 성공했습니다.');
  }
}
