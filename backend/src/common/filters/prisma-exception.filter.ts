import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (error instanceof HttpException) {
      status = error.getStatus();
      const payload = error.getResponse();
      message = typeof payload === 'string'
        ? payload
        : (payload as { message?: string | string[] }).message ?? error.message;
      code = HttpStatus[status] ?? code;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const map: Record<string, [number, string, string]> = {
        P2025: [404, 'Record not found', 'NOT_FOUND'],
        P2002: [409, 'A record with these unique values already exists', 'CONFLICT'],
        P2003: [400, 'A related record does not exist', 'BAD_REQUEST'],
      };
      [status, message, code] = map[error.code] ?? [500, 'Database error', 'DATABASE_ERROR'];
    } else {
      console.error(JSON.stringify({
        level: 'error',
        event: 'request.unhandled_error',
        method: request.method,
        path: request.originalUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }

    response.status(status).json({
      statusCode: status,
      error: code,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
