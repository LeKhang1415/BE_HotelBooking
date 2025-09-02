export interface CreatePaymentResponse {
  providerOrderId?: string; // id trả về từ provider (nếu có)
  qrCode?: string; // raw QR text
  orderId?: string;
  qrDataURL?: string; // ảnh QR base64
}
