export interface WebhookData {
  reference: string;
  status: string;
  amount: number;
  paid_at: string;
  id: number;
  metadata: {
    orderId: string;
    userId: string;
    vendorId: string;
  };
}

export interface WebhookPayload {
  event: string;
  data: WebhookData;
}
