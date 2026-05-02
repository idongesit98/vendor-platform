import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import express from 'express';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(PaymentController.name, {
    timestamp: true,
  });

  constructor(private readonly paymentService: PaymentService) {}

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async handlePayStackWebhook(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody =
      (req as express.Request & { rawBody: Buffer }).rawBody?.toString() ??
      JSON.stringify(req.body);

    this.logger.log(`Webhook received: ${signature ? 'signed' : 'unsigned'}`);

    try {
      await this.paymentService.handleWebhook(rawBody, signature);
      return res.status(200).json({ received: true });
    } catch (error) {
      this.logger.error('This error occurred', error);
      return res.status(200).json({ received: true });
    }
  }
}
