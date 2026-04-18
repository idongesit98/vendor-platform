export type PaystackWebhookPayload = {
  event:
    | 'charge.success'
    | 'charge.failed'
    | 'transfer.success'
    | 'transfer.failed'
    | 'refund.processed';
  data: PaystackTransactionData;
};

type PaystackTransactionData = {
  id: number;
  domain: string;
  status: 'success' | 'failed';
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;

  customer: {
    id: number;
    email: string;
    customer_code: string;
  };

  metadata: {
    orderId: string;
    userId: string;
    vendorId: string;
    [key: string]: unknown;
  };

  authorization?: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bank: string;
  };
};
