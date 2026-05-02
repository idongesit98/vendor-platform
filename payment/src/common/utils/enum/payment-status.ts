export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
}
