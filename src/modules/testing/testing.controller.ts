import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    // Clear all tables by truncating them
    await this.dataSource.query('TRUNCATE TABLE refresh_token_sessions RESTART IDENTITY CASCADE');
    await this.dataSource.query('TRUNCATE TABLE security_devices RESTART IDENTITY CASCADE');
    await this.dataSource.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    // Add any other tables you want to clear for testing
    await this.dataSource.query('TRUNCATE TABLE blogs RESTART IDENTITY CASCADE');
    await this.dataSource.query('TRUNCATE TABLE posts RESTART IDENTITY CASCADE');
    await this.dataSource.query('TRUNCATE TABLE comments RESTART IDENTITY CASCADE');
    await this.dataSource.query('TRUNCATE TABLE comment_likes RESTART IDENTITY CASCADE');
    await this.dataSource.query('TRUNCATE TABLE post_likes RESTART IDENTITY CASCADE');

    return {
      status: 'succeeded',
    };
  }
}
