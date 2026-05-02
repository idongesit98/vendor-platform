import { PaymentStatus } from '@/common/utils/enum';
import {
  InitializeTransactionResponse,
  VerifyTransactionResponse,
} from '@/common/utils/enum/transaction-response';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { createHmac } from 'crypto';
import { catchError, firstValueFrom, retry, throwError, timeout } from 'rxjs';
import {
  CancelTransactionResponse,
  PayStackApiResponse,
  PayStackInitData,
  PayStackRefundData,
  PayStackVerifyData,
  RefundTransactionResponse,
} from '@common/utils/interfaces';
import { AxiosError } from 'axios';

@Injectable()
export class PayStackProvider {
  private readonly logger = new Logger(PayStackProvider.name, {
    timestamp: true,
  });
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly callbackUrl: string;
  private readonly HTTP_TIMEOUT_MS = 30_000;
  private readonly RETRY_COUNT = 2;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.secretKey = this.configService.get<string>('paystack.secretKey')!;
    this.baseUrl = this.configService.get<string>('paystack.baseUrl')!;
    this.callbackUrl = this.configService.get<string>('paystack.callbackUrl')!;

    if (!this.secretKey || !this.baseUrl || !this.callbackUrl) {
      throw new Error(
        'PayStack Provider: Missing required config keys' +
          '(paystack.secretKey | paystack.baseUrl | paystack.callbackUrl)',
      );
    }
  }

  async InitializeTransaction(params: {
    email: string;
    amount: number;
    reference: string;
    metadata: Record<string, unknown>;
  }): Promise<InitializeTransactionResponse> {
    if (!params.amount || params.amount <= 0) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Payment amount must be greater than zero',
      });
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<PayStackApiResponse<PayStackInitData>>(
            `${this.baseUrl}/transaction/initialize`,
            {
              email: params.email,
              amount: Math.round(params.amount * 100), //Convert Naira to kobo
              reference: params.reference,
              metadata: params.metadata,
              callback_url: this.callbackUrl,
            },
            {
              headers: this.authHeader(),
              timeout: this.HTTP_TIMEOUT_MS,
            },
          )
          .pipe(
            timeout(this.HTTP_TIMEOUT_MS),
            catchError((err: AxiosError) =>
              throwError(() =>
                this.mapAxiosError(err, 'InitializeTransaction'),
              ),
            ),
          ),
      );

      const body = response.data;
      if (!body?.status || !body.data?.authorization_url) {
        this.logger.error('Unexpected PayStack init response', body);
        throw new RpcException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Unexpected response from payment provider',
        });
      }

      const { data } = body;
      return {
        reference: data.reference,
        paymentUrl: data.authorization_url,
        accessCode: data.access_code,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('PayStack initialization failed', error);
      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Payment provider unavailable. please try again.',
      });
    }
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyTransactionResponse> {
    if (!reference?.trim()) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Transaction reference is required for verification',
      });
    }
    try {
      const response = await firstValueFrom(
        this.httpService
          .get<PayStackApiResponse<PayStackVerifyData>>(
            `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
            {
              headers: this.authHeader(),
              timeout: this.HTTP_TIMEOUT_MS,
            },
          )
          .pipe(
            timeout(this.HTTP_TIMEOUT_MS),
            retry({
              count: this.RETRY_COUNT,
              delay: 1000,
              resetOnSuccess: true,
            }),
            catchError((err: AxiosError) =>
              throwError(() => this.mapAxiosError(err, 'verifyTransaction')),
            ),
          ),
      );

      const body = response.data;

      if (!body?.status || !body.data) {
        this.logger.error('Unexpected PayStack verify response', body);
        throw new RpcException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message:
            'Unexpected response from payment provider during verification',
        });
      }

      const { data } = body;
      return {
        status: this.mapPayStackStatus(data.status),
        reference: data.reference,
        amount: data.amount / 100,
        paidAt: data.paid_at,
        transactionId: String(data.id),
        raw: body as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(
        `PayStack verification failed for ref: ${reference}`,
        error,
      );

      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Payment verification failed. please contact support.',
      });
    }
  }

  async refundTransaction(params: {
    reference: string;
    amount?: number;
  }): Promise<RefundTransactionResponse> {
    if (!params.reference?.trim()) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Transaction reference is required to initiate a refund',
      });
    }

    if (params.amount !== undefined && params.amount <= 0) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Refund amount must be greater than zero',
      });
    }

    try {
      const body: Record<string, unknown> = {
        transaction: params.reference,
      };

      if (params.amount !== undefined) {
        body.amount = Math.round(params.amount * 100); //convert Naira to kobo
      }

      const response = await firstValueFrom(
        this.httpService
          .post<
            PayStackApiResponse<PayStackRefundData>
          >(`${this.baseUrl}/refund`, body, { headers: this.authHeader(), timeout: this.HTTP_TIMEOUT_MS })
          .pipe(
            timeout(this.HTTP_TIMEOUT_MS),
            catchError((err: AxiosError) =>
              throwError(() => this.mapAxiosError(err, 'refundTransaction')),
            ),
          ),
      );
      const apiResponse = response.data;
      if (!apiResponse?.status || !apiResponse.data) {
        this.logger.error('Unexpected PayStack refund response', apiResponse);
        throw new RpcException({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Unexpected response from payment provider during refund',
        });
      }

      const data = apiResponse.data;
      this.logger.log(
        `PayStack refund initiated - refundId: ${data.id}, ref: ${params.reference}`,
      );

      return {
        refundId: String(data.id),
        reference: data.transaction.reference,
        amount: data.amount / 100,
        status: data.status,
        createdAt: data.createdAt,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(
        `PayStack refund failed for ref: ${params.reference}`,
        error,
      );

      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: `Refund could not be processed by payment provider. Please retry.`,
      });
    }
  }

  async cancelTransaction(
    reference: string,
  ): Promise<CancelTransactionResponse> {
    if (!reference?.trim()) {
      this.logger.warn('Cancel Transaction with empty reference - no-op');
      return { success: false, message: 'No reference was provided' };
    }

    try {
      const current = await this.verifyTransaction(reference);
      if (current.status === PaymentStatus.SUCCESS) {
        this.logger.error(
          `Cancel transaction: reference ${reference} is already PAID -` +
            `Manual reconciliation required`,
        );
        return {
          success: false,
          message:
            'Transaction has already been completed and cannot be cancelled. ' +
            'Manual reconciliation required.',
        };
      }

      this.logger.warn(
        `Cancel transaction: reference ${reference} (status: ${current.status}` +
          'Will expire naturally. Logged for reconciliation.',
      );

      return {
        success: true,
        message: `Transaction ${reference} is pending and will expire. Logged for reconciliation`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Cancel transaction: could not verify ${reference} - ${message}. ` +
          'Manual reconciliation required.',
      );
      return {
        success: false,
        message: `Could not verify transaction status for ${reference}. Manual review required.`,
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature) return false;

    const hash = createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');

    try {
      const hashBuffer = Buffer.from(hash, 'hex');
      const sigBuffer = Buffer.from(signature, 'hex');

      if (hashBuffer.length !== sigBuffer.length) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-require-imports,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      return require('crypto').timingSafeEqual(hashBuffer, sigBuffer);
    } catch {
      return false;
    }
  }

  private authHeader(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Maps PayStack's raw status strings to our internal PaymentStatus enum.
   * This keeps PayStack vocabulary contained to this provider - the rest of
   * the will not import raw PayStack strings.
   * */

  private mapPayStackStatus(raw: string): PaymentStatus {
    switch (raw?.toLowerCase()) {
      case 'success':
        return PaymentStatus.SUCCESS;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'abandoned':
        return PaymentStatus.FAILED;
      case 'pending':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapAxiosError(err: AxiosError, operation: string): RpcException {
    const status = err.response?.status;
    const payStackMessage =
      (err.response?.data as { message?: string } | undefined)?.message ??
      err.message;

    this.logger.error(
      `[${operation}] PayStack HTTP ${status ?? 'N/A'}: ${payStackMessage}`,
    );

    if (status && status >= 400 && status < 500) {
      return new RpcException({
        statusCode: status,
        message: `Payment provider rejected the request: ${payStackMessage}`,
      });
    }

    return new RpcException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Payment provider is temporarily unavailable. Please try again.',
    });
  }
}
