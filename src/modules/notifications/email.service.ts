import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailAdapter } from './email.adapter';

@Injectable()
export class EmailService {
  constructor(private emailAdapter: EmailAdapter) {}

  // Store the last confirmation code for tests
  private static lastConfirmationCode: string | null = null;

  static getLastConfirmationCode(): string | null {
    return EmailService.lastConfirmationCode;
  }

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    // Store code for tests
    EmailService.lastConfirmationCode = code;

    //can add html templates, implement advertising and other logic for mailing...
    await this.emailAdapter.sendEmail(email, "Registration Confirmation", `<h1>Thank for your registration</h1>
 <p>To finish registration please follow the link below:
     <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
 </p>`)
  }

  async sendPasswordRecoveryEmail(email: string, recoveryCode: string): Promise<void> {
    await this.emailAdapter.sendEmail(email, "Password Recovery", `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
      </p>`)
  }
}
