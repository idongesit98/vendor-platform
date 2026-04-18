import {
  verificationEmailHtml,
  verificationVendorEmailHtml,
} from '@/common/utils/email/verification.email';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  type?: 'user' | 'vendor';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  otp?: string;
  verificationLink?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name, { timestamp: true });
  private transporter: Mail;

  constructor() {
    //send this to my .env later
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  }

  async sendMail(options: SendMailOptions) {
    try {
      const {
        to,
        subject,
        firstName,
        businessName,
        otp,
        verificationLink,
        type,
      } = options;

      const name = firstName || businessName;

      if (!name) {
        throw new Error('Either First name or Business name must be provided');
      }

      const html =
        type === 'vendor'
          ? verificationVendorEmailHtml(name, otp!, verificationLink!)
          : verificationEmailHtml(name, otp!, verificationLink!);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: 'noreply@foody.com',
        to: to,
        subject: subject,
        html: html,
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
