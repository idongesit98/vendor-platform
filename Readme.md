
                        ┌─────────────────┐
                        │    Nginx/ALB    │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   API Gateway   │
                        │  + WebSocket    │
                        └────────┬────────┘
                                 │ TCP
          ┌──────────────────────┼──────────────────────┐
          │                      │                       │
    ┌─────▼──────┐      ┌───────▼───────┐     ┌────────▼───────┐
    │    User    │      │   Menu Item   │     │     Order      │
    │  Service   │      │   Service     │     │    Service     │
    │ + Reviews  │      │  + Search     │     │  + Coupons     │
    └────────────┘      └───────────────┘     └────────────────┘
          │                                          │
    ┌─────▼──────┐      ┌───────────────┐     ┌────────▼───────┐
    │  Payment   │      │  Notification │     │   Delivery     │
    │  Service   │      │   Service     │     │   Service      │
    │  + Wallet  │      │  + WebSocket  │     │  + Tracking    │
    └────────────┘      └───────────────┘     └────────────────┘
          │                      │
    ┌─────▼──────┐      ┌───────▼───────┐
    │ Analytics  │      │    Coupon     │
    │  Service   │      │   Service     │
    └────────────┘      └───────────────┘

# 🍔 Food Delivery API

A RESTful API for managing food delivery services — restaurants, menus, orders, delivery tracking, and payments.
---

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Webhooks](#webhooks)
- [Support](#support)

---

## Requirements

- HTTPS client
- A valid API key from the [dashboard](https://dashboard.fooddelivery.com)

---

## Getting Started

**Base URL**

```
https://api.fooddelivery.com/v1
```

**Quick example — fetch open restaurants near you:**

```bash
curl -X GET "https://api.fooddelivery.com/v1/vendors?open_now=true&lat=6.45&lng=3.38" \
  -H "Authorization: Bearer <your_api_key>"
```

For all available endpoints, request/response schemas, and live testing, see the **[Postman docs](https://documenter.getpostman.com/view/30530080/2sBXwjxEXW)**.

---

## Authentication

All requests must include a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <bearer_token>
```

Tokens expire after **24 hours**. Refresh using `POST /auth/refresh`.

Get your API key at [https://dashboard.fooddelivery.com](https://dashboard.fooddelivery.com).

---

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "No order found with ID ord_00000",
    "status": 404
  }
}
```

| HTTP Status | Meaning                                |
|-------------|----------------------------------------|
| `400`       | Bad request / invalid params           |
| `401`       | Missing or invalid token               |
| `403`       | Forbidden                              |
| `404`       | Resource not found                     |
| `422`       | Unprocessable (e.g. restaurant closed) |
| `429`       | Rate limit exceeded                    |
| `500`       | Internal server error                  |

---

## Webhooks

Register a webhook URL in your dashboard to receive real-time event notifications.

**Supported events:** `order.confirmed`, `order.in_transit`, `order.delivered`, `order.cancelled`, `payment.succeeded`, `payment.failed`, `refund.processed`

All webhook requests include an HMAC signature for verification:

```
X-Signature: sha256=<hmac_hash>
```

---

## Support

- 📧 [api-support@fooddelivery.com](mailto:robsonidongesitsamuel@gmail.com)
- 🐛 [GitHub Issues](https://github.com/idongesit98/vendor-platform/issues)
- 📖 [Postman Docs](https://documenter.getpostman.com/view/30530080/2sBXwjxEXW)
