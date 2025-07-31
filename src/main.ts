// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply validation pipe with proper configuration
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // Automatically transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Allow implicit type conversion
    },
    whitelist: true, // Strip properties that don't have decorators
    forbidNonWhitelisted: false, // Don't throw error for non-whitelisted properties
    errorHttpStatusCode: 400,
    exceptionFactory: (errors) => {
      const errorsMessages = errors.map(error => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', ')
      }));
      
      return new BadRequestException({ errorsMessages });
    }
  }));
  
  // Apply exception filter globally
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable CORS if needed
  app.enableCors();
  
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();