import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { Prisma } from 'src/prisma/generated/prisma/client';
import z, { prettifyError, ZodError } from 'zod';
import { BaseResponseSchema, ErrorResponseSchema } from '../dto/base-response';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message ?? 'Internal server error';
    let error = 'InternalServerError';

    let res;

    // zod exception
    if (
      exception instanceof ZodValidationException ||
      exception instanceof ZodSerializationException
    ) {
      status = exception.getStatus();
      res = exception.getResponse() as any;
      message = z.prettifyError(exception.getZodError() as ZodError);
      error = res.errors;
    }

    // prisma client exception
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000': // data too long
          status = HttpStatus.BAD_REQUEST;
          message = `value too long for column`;
          error = 'ValueTooLong';
          break;
        case 'P2002': // duplicate key
          status = HttpStatus.CONFLICT;
          message = exception.message.match(
            /Unique constraint failed on the fields: \((.+)\)/,
          )?.[0];
          error = 'DuplicateKey';
          break;
        case 'P2003': // not found foreign key
          status = HttpStatus.BAD_REQUEST;
          message = `Not found foreign key: ${exception.meta?.field_name ?? 'unknown'}`;
          error = 'NotFound';
          break;
        case 'P2025': // record not found
          const record = exception.meta?.modelName ?? 'Record';

          status = HttpStatus.NOT_FOUND;
          message = `${record} not found`;
          error = 'RecordNotFound';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `${exception.message}`;
          error = `${exception.name}`;
          console.log(exception.meta);
          break;
      }
    }
    // http
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      res = exception.getResponse();
      message = res.message;
      error = res.error;
    }

    response.status(status).json(
      ErrorResponseSchema.parse({
        statusCode: status,
        success: false,
        error,
        message,
      }),
    );
  }
}
