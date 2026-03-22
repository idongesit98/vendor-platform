export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  ABANDONED = 'abandoned',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
}
