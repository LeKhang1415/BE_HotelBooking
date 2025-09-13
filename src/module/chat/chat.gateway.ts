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
      this;
    } else {
      this.logger.log(`User connected: ${email}`);
      const conv = await this.chatService.getOrCreateConversation(email);
      this.logger.log(`User ${email} joined conversation: ${conv.id}`);
      this.joinConversation(client, conv.id.toString(), role);
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

    try {
      const body = JSON.parse(bodyText as string);
      this.logger.log(`Received message from ${email}: ${body.text}`);

      const isAdminSender = role === UserRole.Staff;

      const conversationId = await this.chatService.resolveConversationId({
        requesterEmail: email,
        isAdmin: isAdminSender,
        toUserEmail: body.toUserEmail,
        conversationId: body.conversationId,
      });

      this.logger.log(`Resolved conversationId: ${conversationId}`);

      const newMessage = await this.chatService.sendMessage({
        senderEmail: email,
        text: body.text,
        isAdminSender,
        toUserEmail: body.toUserEmail,
        conversationId: conversationId,
      });

      this.logger.log(
        `Message sent by ${email}: ${newMessage.text} to conversation ${newMessage.conversationId}`,
      );

      this.server
        .to(`conversation:${newMessage.conversationId}`)
        .emit('message', newMessage);

      this.server
        .to(`admin:${await this.chatService.getAdminEmail()}`)
        .emit('inboxUpdated', newMessage);

      return { status: 'success', messageId: newMessage.id };
    } catch (error) {
      this.logger.error(`Error sending message from ${email}:`, error.message);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() bodyText: { conversationId?: string; toUserEmail?: string },
  ) {
    this.logger.log(
      `Client ${client.id} joining room with body: ${JSON.stringify(bodyText)}`,
    );
    const { role } = (client as any).user;
    const body = JSON.parse(bodyText as string);
    this.joinConversation(client, body.conversationId!, role);
    return { status: 'success', conversationId: body.conversationId };
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() bodyText: { conversationId?: string; toUserEmail?: string },
  ) {
    this.logger.log(
      `Client ${client.id} Leaving room with body: ${JSON.stringify(bodyText)}`,
    );
    const body = JSON.parse(bodyText as string);
    client.leave(`conversation:${body.conversationId}`);
    return { status: 'success', conversationId: body.conversationId };
  }

  @SubscribeMessage('typing')
  async onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { conversationId?: string; toUserEmail?: string; isTyping: boolean },
  ) {
    const { email, role } = (client as any).user;

    try {
      const conversationId = await this.chatService.resolveConversationId({
        requesterEmail: email,
        isAdmin: role === UserRole.Staff,
        toUserEmail: body.toUserEmail,
        conversationId: body.conversationId,
      });

      this.logger.debug(
        `${email} typing in conversation ${conversationId}: ${body.isTyping}`,
      );

      this.server.to(`conversation:${conversationId}`).emit('typing', {
        fromEmail: email,
        isTyping: body.isTyping,
        conversationId: conversationId,
      });

      return { status: 'success', conversationId };
    } catch (error) {
      this.logger.error(
        `Error handling typing event from ${email}:`,
        error.message,
      );
      return { status: 'error', message: error.message };
    }
  }

  private async joinConversation(
    client: Socket,
    conversationId: string,
    role: UserRole,
  ) {
    this.logger.debug(
      `Client ${client.id} joining conversation ${conversationId} with role ${role}`,
    );
    client.join(`conversation:${conversationId}`);
  }
}
