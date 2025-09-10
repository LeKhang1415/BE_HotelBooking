import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
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

  @SubscribeMessage('chat:sendMessage')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
