export interface OrderResponse {
  message: string;
  Orders: {
    orderId: string;
    userId: string;
    vendorId: string;
    totalAmount: number;
    status: string;
  };
}
