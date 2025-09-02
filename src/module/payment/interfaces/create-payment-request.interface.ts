export interface CreatePaymentRequest {
  amount: number; // số tiền
  orderId: string; // mã đơn hàng/booking
  description: string; // nội dung chuyển khoản
  returnUrl?: string; // url redirect về sau khi thanh toán
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}
