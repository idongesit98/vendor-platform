export type PaymentProviderResponse = {
  amount: number;
  paid_at: string;
  id: number;
  metadata: {
    orderId: string;
    userId: string;
    vendorId: string;
  };
};
