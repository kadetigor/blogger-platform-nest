import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Log the failing request details
    console.log('🔴 Validation Error on:', request.method, request.url);
    console.log('🔴 Query params:', request.query);
    console.log('🔴 Body:', request.body);
    console.log('🔴 Error:', JSON.stringify(exceptionResponse, null, 2));

    // If it's a validation error, format it properly
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      const errorsMessages = exceptionResponse.message.map((msg: string) => {
        const fieldMatch = msg.match(/^(\w+)/);
        const field = fieldMatch ? fieldMatch[1] : 'unknown';

        return {
          field: field,
          message: msg
        };
      });

      response.status(status).json({
        errorsMessages
      });
    } else {
      response.status(status).json(exceptionResponse);
    }
  }
}