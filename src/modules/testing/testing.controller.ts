import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('testing')
export class TestingController {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    // Clear all tables by truncating them
    await this.databaseService.sql`TRUNCATE TABLE refresh_token_sessions RESTART IDENTITY CASCADE`;
    await this.databaseService.sql`TRUNCATE TABLE security_devices RESTART IDENTITY CASCADE`;
    await this.databaseService.sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;

    // Add any other tables you want to clear for testing
    // await this.databaseService.sql`TRUNCATE TABLE blogs RESTART IDENTITY CASCADE`;
    // await this.databaseService.sql`TRUNCATE TABLE posts RESTART IDENTITY CASCADE`;
    // await this.databaseService.sql`TRUNCATE TABLE comments RESTART IDENTITY CASCADE`;

    return {
      status: 'succeeded',
    };
  }
}
