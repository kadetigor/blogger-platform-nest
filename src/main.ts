// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './core/pipes/custom-validation.pipe';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply custom validation pipe globally
  app.useGlobalPipes(new CustomValidationPipe());
  
  // Apply exception filter globally
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable CORS if needed
  app.enableCors();
  
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();