export interface InitializeTransactionResponse {
  reference: string;
  paymentUrl: string;
  accessCode: string;
}

export interface VerifyTransactionResponse {
  status: Status;
  reference: string;
  amount: number;
  paidAt: string;
  transactionId: string;
  raw: Record<string, unknown>;
}

export enum Status {
  SUCCESS = 'success',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
  PENDING = 'pending',
}
