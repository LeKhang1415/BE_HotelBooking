export interface VerifyPaymentResponse {
  isPaid: boolean; // đã thanh toán hay chưa
  transactionId?: string; // mã giao dịch bên provider
  amount?: number; // số tiền thực trả
  paidAt?: Date; // thời gian thanh toán
  raw?: any; // dữ liệu gốc từ provider
}
