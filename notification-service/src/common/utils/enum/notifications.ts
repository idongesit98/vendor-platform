export enum NotificationType {
  USER_REGISTERED = 'user.registered',
  EMAIL_VERIFICATION = 'user.verified',
  USER_OTP_RESENT = 'user.otp.resent',
  ORDER_CREATED = 'order_created',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_READY = 'order_ready',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  VENDOR_REGISTERED = 'vendor.registered',
  VENDOR_VERIFIED = 'vendor_verified',
  VENDOR_OTP_RESENT = 'vendor.otp.resent',
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum OrderStatus {
  CREATED = 'order_created',
  CONFIRMED = 'order_confirmed',
  PREPARING = 'order_preparing',
  READY = 'order_ready',
  DELIVERED = 'order_delivered',
  CANCELLED = 'order_cancelled',
}

export enum RecipientType {
  USER = 'user',
  VENDOR = 'vendor',
}
