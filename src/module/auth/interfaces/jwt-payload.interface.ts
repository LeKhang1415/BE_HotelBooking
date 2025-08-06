export interface JwtPayload {
  id: string; // user ID
  email: string; // hoặc username tuỳ hệ thống
  role: string;
}
