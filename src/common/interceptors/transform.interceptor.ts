import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';
import { BaseResponseSchema } from '../dto/base-response';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((responseData) => {
        const res = context.switchToHttp().getResponse();
        if (res.headersSent) return responseData;

        return BaseResponseSchema.parse({
          statusCode: res.statusCode,
          success: responseData.success,
          data: responseData.data,
          message: responseData.message,
        });
      }),
    );
  }
}
