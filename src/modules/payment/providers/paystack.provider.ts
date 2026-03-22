import {
  InitializeTransactionResponse,
  Status,
  VerifyTransactionResponse,
} from '@/common/utils/enum/transaction-response';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { createHmac } from 'crypto';
import { firstValueFrom } from 'rxjs';

export class PaystackProvider {
  private readonly logger = new Logger(PaystackProvider.name, {
    timestamp: true,
  });
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.secretKey = this.configService.get<string>('paystack.secretKey')!;
    this.baseUrl = this.configService.get<string>('paystack.baseUrl')!;
  }

  async InitializeTransaction(params: {
    email: string;
    amount: number;
    reference: string;
    metadata: Record<string, unknown>;
    callbackUrl: string;
  }): Promise<InitializeTransactionResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: params.email,
            amount: Math.round(params.amount * 100),
            reference: params.reference,
            metadata: params.metadata,
            callback_url: params.callbackUrl,
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const { data } = response.data as {
        data: {
          authorization_url: string;
          access_code: string;
          reference: string;
        };
      };

      return {
        reference: data.reference,
        paymentUrl: data.authorization_url,
        accessCode: data.access_code,
      };
    } catch (error) {
      this.logger.error('Paystack initialization failed', error);
      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Payment provider unavailable. please try again.',
      });
    }
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyTransactionResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          },
        ),
      );

      const { data } = response.data as {
        data: {
          status: string;
          reference: string;
          amount: number;
          paid_at: string;
          id: number;
        };
      };

      return {
        status: data.status as Status,
        reference: data.reference,
        amount: data.amount / 100,
        paidAt: data.paid_at,
        transactionId: String(data.id),
        raw: response.data as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.error(
        `Paystack verification failed for ref: ${reference}`,
        error,
      );

      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Payment verification failed. please contact support.',
      });
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }
}
