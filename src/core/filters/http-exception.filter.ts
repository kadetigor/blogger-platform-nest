import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Check if the response already has the correct format
    if (
      typeof exceptionResponse === 'object' &&
      'errorsMessages' in exceptionResponse
    ) {
      response.status(status).json(exceptionResponse);
      return;
    }

    // Handle validation errors from CustomValidationPipe
    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const responseBody = exceptionResponse as any;
      
      // If it's already in the correct format, return it
      if (responseBody.errorsMessages) {
        response.status(status).json(responseBody);
        return;
      }

      // Transform NestJS default validation format
      if (Array.isArray(responseBody.message)) {
        const errorsMessages = responseBody.message.map((msg: string) => {
          // Try to extract field name from validation message
          const fieldMatch = msg.match(/^(\w+)\s/);
          const field = fieldMatch ? fieldMatch[1] : 'field';
          
          return {
            message: msg,
            field: field,
          };
        });

        response.status(status).json({ errorsMessages });
        return;
      }
    }

    // Default error response
    response.status(status).json({
      errorsMessages: [
        {
          field: 'unknown',
          message: exception.message
        }
      ]
    });
  }
}