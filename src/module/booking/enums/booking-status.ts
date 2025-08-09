export enum BookingStatus {
  Unpaid = 'unpaid', // Chưa thanh toán
  Paid = 'paid', // Đã thanh toán
  CheckedIn = 'checked_in', // Đã check-in
  Completed = 'completed', // Hoàn thành (đã check-out)
  Cancelled = 'cancelled', // Đã hủy bởi khách
  Rejected = 'rejected', // Bị từ chối bởi admin
}
