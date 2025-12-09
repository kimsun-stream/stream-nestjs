import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class CustomWsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    console.log(exception);
    const errorResponse = {
      status: 'error',
      message: exception instanceof Error ? exception.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };

    client.send(JSON.stringify(errorResponse));
  }
}
