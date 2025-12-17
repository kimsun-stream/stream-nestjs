import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const RefreshToken = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const cookie = req.headers.cookie;
  if (!cookie) return null;

  const refreshToken = cookie
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('refreshToken='))
    ?.split('=')[1];

  if (!refreshToken) throw new UnauthorizedException('Invalid token');
  return refreshToken;
});
