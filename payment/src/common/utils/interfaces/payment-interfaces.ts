export interface InitializePaymentResponse {
  paymentUrl: string;
  reference: string;
  paymentId: string;
}

export interface RefundTransactionResponse {
  refundId: string;
  reference: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface CancelTransactionResponse {
  success: boolean;
  message: string;
}

export interface PayStackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PayStackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PayStackVerifyData {
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
  id: number;
}

export interface PayStackRefundData {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  transaction: { reference: string };
}
