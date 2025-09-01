export enum BookingStatus {
  Unpaid = 'unpaid', // Chưa thanh toán
  Paid = 'paid', // Đã thanh toán
  CheckedIn = 'checked_in', // Đã check-in
  CheckedOutPendingPayment = 'checked_out_pending_payment', // Đã trả phòng nhưng còn nợ phụ phí
  Completed = 'completed', // Hoàn thành (đã check-out và thanh toán hết)
  Cancelled = 'cancelled', // Đã hủy bởi khách
  Rejected = 'rejected', // Bị từ chối bởi admin
}
