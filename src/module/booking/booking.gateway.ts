import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Booking } from './entities/booking.entity';

@WebSocketGateway({
  namespace: '/booking',
  cors: {
    origin: '*',
  },
})
export class BookingGateWay {
  @WebSocketServer()
  server: Server;

  emitBookingNoShow(booking: Booking) {
    this.server.emit('bookingNoShow', booking);
  }

  emitBookingCheckedOut(booking: Booking) {
    this.server.emit('bookingCheckedOut', booking);
  }
}
