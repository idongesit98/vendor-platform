import {
  NotificationType,
  RecipientType,
} from '@/common/utils/enum/notifications';

/**
 * This file determines what message will be sent when certain events occurs in this service
 */
interface NotificationTemplate<T> {
  title: (data: T) => string;
  message: (data: T) => string;
}

interface OrderNotificationsData {
  orderId: string;
  totalAmount?: number;
}

interface PaymentNotificationData {
  orderId: string;
  totalAmount?: number;
}

interface UserNotificationData {
  email: string;
  firstName: string;
  lastName: string;
  otp?: string;
  verificationLink?: string;
}

interface VendorNotificationDate {
  businessName: string;
  phone: string;
  otp?: string;
  verificationLink?: string;
}

// interface VerificationData {
//   vendorId: string;
// }

const shortOrderId = (orderId: string) => orderId.slice(0, 8);

/**
 * NotificationPayloadMap maps the notificationType to the correct notification data
 */
type NotificationPayloadMap = {
  [NotificationType.USER_REGISTERED]: UserNotificationData;
  [NotificationType.EMAIL_VERIFICATION]: UserNotificationData;
  [NotificationType.USER_OTP_RESENT]: UserNotificationData;
  [NotificationType.ORDER_CREATED]: OrderNotificationsData;
  [NotificationType.ORDER_CONFIRMED]: OrderNotificationsData;
  [NotificationType.ORDER_PREPARING]: OrderNotificationsData;
  [NotificationType.ORDER_READY]: OrderNotificationsData;
  [NotificationType.ORDER_DELIVERED]: OrderNotificationsData;
  [NotificationType.ORDER_CANCELLED]: OrderNotificationsData;

  [NotificationType.PAYMENT_INITIATED]: PaymentNotificationData;
  [NotificationType.PAYMENT_COMPLETED]: PaymentNotificationData;
  [NotificationType.PAYMENT_FAILED]: PaymentNotificationData;

  [NotificationType.VENDOR_REGISTERED]: VendorNotificationDate;
  [NotificationType.VENDOR_VERIFIED]: VendorNotificationDate;
  [NotificationType.VENDOR_OTP_RESENT]: VendorNotificationDate;
};

/**
 * @param type This tells the type of notification sent out
 * @param recipientType The recipient receiving the information
 * @param data The data received from the event
 * @returns Title and message sent to the receiver
 */

export function getNotificationTemplate(
  type: NotificationType,
  recipientType: RecipientType,
  data: any,
) {
  const template = notificationTemplates?.[type]?.[recipientType];

  if (!template) {
    return {
      title: 'Notification',
      message: 'You have no new notification',
    };
  }

  return {
    title: template.title(data),
    message: template.message(data),
  };
}
export const notificationTemplates: {
  [k in NotificationType]?: Partial<
    Record<RecipientType, NotificationTemplate<NotificationPayloadMap[k]>>
  >;
} = {
  [NotificationType.USER_REGISTERED]: {
    [RecipientType.USER]: {
      title: () => 'User successfully registered',
      message: (data: UserNotificationData) =>
        `Hi ${data.firstName}, welcome! Please verify your email address`,
    },
  },
  [NotificationType.EMAIL_VERIFICATION]: {
    [RecipientType.USER]: {
      title: () => 'Verify your email',
      message: (data: UserNotificationData) =>
        `Hi ${data.firstName}, your OTP is ${data.otp}. It expires in 10minutes`,
    },
  },
  [NotificationType.USER_OTP_RESENT]: {
    [RecipientType.USER]: {
      title: () => 'Otp Resent',
      message: (data: UserNotificationData) =>
        `Hi ${data.firstName}, your OTP is ${data.otp}, it expires in 10 minutes`,
    },
  },
  [NotificationType.ORDER_CREATED]: {
    [RecipientType.VENDOR]: {
      title: () => 'New Order Received',
      message: (data: OrderNotificationsData) =>
        `You have a new order #${shortOrderId(data.orderId)} worth ${data.totalAmount}. Please confirm it.`,
    },
    [RecipientType.USER]: {
      title: () => 'Order Placed successfully',
      message: (data: OrderNotificationsData) =>
        `Your order ${shortOrderId(data.orderId)} has been placed and is awaiting vendor confirmation.`,
    },
  },
  [NotificationType.ORDER_CONFIRMED]: {
    [RecipientType.USER]: {
      title: () => 'Order confirmed',
      message: (data: OrderNotificationsData) =>
        `Your order ${shortOrderId(data.orderId)} is processing for pickup/delivery.`,
    },

    [RecipientType.VENDOR]: {
      title: () => 'Order confirmed',
      message: (data: OrderNotificationsData) =>
        `You have confirmed the following order ${shortOrderId(data.orderId)} for processing to pickup/delivery.`,
    },
  },
  [NotificationType.ORDER_PREPARING]: {
    [RecipientType.USER]: {
      title: () => 'Order Being prepared',
      message: (data: OrderNotificationsData) =>
        `Your order ${shortOrderId(data.orderId)} is currently being prepared.`,
    },
  },
  [NotificationType.ORDER_READY]: {
    [RecipientType.USER]: {
      title: () => 'Order Ready',
      message: (data: OrderNotificationsData) =>
        `Your order ${shortOrderId(data.orderId)} is ready for pickup/delivery.`,
    },
  },
  [NotificationType.ORDER_DELIVERED]: {
    [RecipientType.USER]: {
      title: () => 'Order Delivered',
      message: (data: OrderNotificationsData) =>
        `Your order ${shortOrderId(data.orderId)} has been delivered. Enjoy your meal!`,
    },
    [RecipientType.VENDOR]: {
      title: () => 'Order Delivered',
      message: (data: OrderNotificationsData) =>
        `Order ${shortOrderId(data.orderId)} has been delivered to your customer.`,
    },
  },
  [NotificationType.ORDER_CANCELLED]: {
    [RecipientType.USER]: {
      title: () => 'Order Cancelled',
      message: (data: OrderNotificationsData) =>
        `Your order ${shortOrderId(data.orderId)} has been delivered. Enjoy your meal!`,
    },
    [RecipientType.VENDOR]: {
      title: () => 'Order Cancelled',
      message: (data: OrderNotificationsData) =>
        `Order ${shortOrderId(data.orderId)} has been cancelled by customer`,
    },
  },
  [NotificationType.PAYMENT_INITIATED]: {
    [RecipientType.USER]: {
      title: () => 'Payment Processing',
      message: (data: PaymentNotificationData) =>
        `Payment of ₦${shortOrderId(data.orderId)} for order #${String(data.orderId).slice(0, 8)} is being processed.`,
    },
  },
  [NotificationType.PAYMENT_COMPLETED]: {
    [RecipientType.USER]: {
      title: () => 'Payment Successful',
      message: (data: PaymentNotificationData) =>
        `Payment of ₦${data.totalAmount} for order ${shortOrderId(data.orderId)} was successful.`,
    },
    [RecipientType.VENDOR]: {
      title: () => 'Payment Received',
      message: (data: PaymentNotificationData) =>
        `Payment of ₦${data.totalAmount} for order #${shortOrderId(data.orderId)} has been received.`,
    },
  },
  [NotificationType.PAYMENT_FAILED]: {
    [RecipientType.USER]: {
      title: () => 'Payment Failed',
      message: (data: PaymentNotificationData) =>
        `Payment for order #${data.totalAmount} failed. Please try again.`,
    },
  },
  [NotificationType.VENDOR_REGISTERED]: {
    [RecipientType.VENDOR]: {
      title: () => 'Vendor successfully registered',
      message: (data: VendorNotificationDate) =>
        `Hi ${data.businessName}, welcome! Please verify your email address`,
    },
  },
  [NotificationType.VENDOR_VERIFIED]: {
    [RecipientType.VENDOR]: {
      title: () => 'Account Verified',
      message: (data: VendorNotificationDate) =>
        `Congratulations! Your vendor account ${data.businessName} has been verified. You can now proceed to setup your page with sumptous meals.`,
    },
  },
  [NotificationType.VENDOR_OTP_RESENT]: {
    [RecipientType.VENDOR]: {
      title: () => 'Vendor successfully registered awaiting resent OTP',
      message: (data: VendorNotificationDate) =>
        `Hi ${data.businessName}, welcome. You missed your otp and we value you enough to resend one to you.`,
    },
  },
};
