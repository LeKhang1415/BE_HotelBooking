import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../users/enum/user-role.enum';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(server: Server) {
    server.use((socket: Socket, next) => {
      try {
        const raw =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization ||
          (socket.handshake.query?.token as string | undefined);

        if (!raw) return next(new Error('Unauthorized'));

        const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

        const payload = this.jwt.verify(token);
        (socket as any).user = payload;
        next();
      } catch (err) {
        return next(new Error('Unauthorized'));
      }
    });
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const user = (client as any).user;
    if (!user) {
      client.disconnect(true);
      return;
    }
    const { email, role } = user;
    if (role === UserRole.Staff) {
      this.logger.log(`Admin connected: ${email}`);
      client.join(`admin:${email}`);
    } else {
      this.logger.log(`User connected: ${email}`);
      client.join(`user:${email}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const user = (client as any).user;
    if (user) {
      this.logger.log(`User ${user.email} disconnected`);
    }
  }
  @SubscribeMessage('send')
  async handleSendMessage(
    @MessageBody()
    bodyText: string,
    @ConnectedSocket() client: Socket,
  ) {
    const { email, role } = (client as any).user;
    this.logger.debug(`Raw message from ${email}: ${bodyText}`);

    const body = JSON.parse(bodyText as string);
    this.logger.log(`Received message from ${email}: ${body.text}`);

    const isAdminSender = role === UserRole.Staff; // hoặc UserRole.Staff nếu bạn dùng enum

    // Gọi service để lưu message
    const newMessage = await this.chatService.sendMessage({
      senderEmail: email,
      text: body.text,
      isAdminSender,
      toUserEmail: body.toUserEmail,
      conversationId: body.conversationId,
    });

    // Emit lại cho người gửi
    client.emit('message', newMessage);

    // Emit cho người nhận
    const room = isAdminSender
      ? `user:${newMessage.toEmail}`
      : `admin:${await this.chatService.getAdminEmail()}`;

    this.logger.debug(
      `Emit to room: ${room}, message: ${JSON.stringify(newMessage)}`,
    );

    this.server.to(room).emit('message', newMessage);
  }
}
