import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { EmailAdapter } from './email.adapter';

@Module({
  providers: [EmailService, EmailAdapter],
  exports: [EmailService],
})
export class NotificationsModule {}
