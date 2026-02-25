import { verifyLinkHtml, verifyLinkText } from '@/common/utils/email';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class MailService {
  private transporter: Mail;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  }

  async sendMail(email: string, url: string) {
    const mailOptions = {
      from: 'noreply@example.com',
      to: email,
      subject: 'Verify Login Link',
      text: verifyLinkText(url, email),
      html: verifyLinkHtml(url, email),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail(mailOptions);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
