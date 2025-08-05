// src/common/filters/validation-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // If it's a validation error, format it properly
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      const errorsMessages = exceptionResponse.message.map((msg: string) => {
        // Extract field name from validation message
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