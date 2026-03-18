import { verificationEmailHtml } from '@/common/utils/email/verification.email';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  firstName: string;
  otp: string;
  verificationLink: string;
}
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name, { timestamp: true });
  private transporter: Mail;

  constructor() {
    //send this to .env later
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  }

  async sendMail(options: SendMailOptions) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: 'noreply@foody.com',
        to: options.to,
        subject: options.subject,
        html: verificationEmailHtml(
          options.firstName,
          options.otp,
          options.verificationLink,
        ),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`Email sent: ${info.messageId} -> ${options.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${String(error)}`,
      );
    }
  }
}
