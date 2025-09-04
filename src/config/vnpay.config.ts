import { registerAs } from '@nestjs/config';

export default registerAs('vnpay', () => ({
  tmnCode: process.env.VNPAY_TMN_CODE,
  hashSecret: process.env.VNPAY_HASH_SECRET,
  url:
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  // Return URL phải trỏ về backend để xử lý callback
  returnUrl:
    process.env.VNPAY_RETURN_URL ||
    'http://localhost:3000/payment/vnpay/return',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl:
    process.env.VNPAY_API_URL ||
    'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
}));
