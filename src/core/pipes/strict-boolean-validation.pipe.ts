import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class StrictBooleanValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Check if the value is an object (request body)
    if (metadata.type === 'body' && typeof value === 'object' && value !== null) {
      // Check if 'published' field exists and is a string
      if ('published' in value && typeof value.published === 'string') {
        throw new BadRequestException({
          message: [
            {
              field: 'published',
              message: 'published must be a boolean value'
            }
          ],
          error: 'Bad Request',
          statusCode: 400
        });
      }
    }
    return value;
  }
}