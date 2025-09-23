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
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const raw =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization ||
          (socket.handshake.query?.token as string | undefined);

        if (!raw) return next(new Error('Unauthorized'));

        const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

        const payload = this.jwt.verify(token);

        // Lấy full user từ database thay vì chỉ dùng payload
        const user = await this.userRepository.findOne({
          where: { email: payload.email },
        });

        if (!user) return next(new Error('User not found'));

        (socket as any).user = user;
        next();
      } catch (err) {
        return next(new Error('Unauthorized'));
      }
    });
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const user = (client as any).user as User;

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
      const conv = await this.chatService.getOrCreateConversation(user);
      this.logger.log(`User ${email} joined conversation: ${conv.id}`);
      this.joinConversation(client, conv.id.toString(), role);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const user = (client as any).user as User;
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
    const user = (client as any).user as User;

    try {
      const body = JSON.parse(bodyText as string);
      this.logger.log(`Received message from ${user.email}: ${body.text}`);

      const isAdminSender = user.role === UserRole.Staff;

      // Tìm toUser nếu có toUserEmail
      let toUser: User | undefined;
      if (body.toUserEmail) {
        const foundUser = await this.userRepository.findOne({
          where: { email: body.toUserEmail },
        });
        toUser = foundUser === null ? undefined : foundUser;

        if (!toUser) {
          return { status: 'error', message: 'Target user not found' };
        }
      }

      const conversationId = await this.chatService.resolveConversationId({
        requester: user,
        isAdmin: isAdminSender,
        toUser: toUser,
        conversationId: body.conversationId,
      });

      this.logger.log(`Resolved conversationId: ${conversationId}`);

      const newMessage = await this.chatService.sendMessage({
        sender: user,
        text: body.text,
        isAdminSender,
        toUser: toUser,
        conversationId: conversationId,
      });

      this.logger.log(
        `Message sent by ${user.email}: ${newMessage.text} to conversation ${newMessage.conversationId}`,
      );

      // Emit message to conversation room
      this.server
        .to(`conversation:${newMessage.conversationId}`)
        .emit('message', newMessage);

      // Emit inbox update to admin
      const adminUser = await this.chatService.getAdminUser();
      this.server
        .to(`admin:${adminUser.email}`)
        .emit('inboxUpdated', newMessage);

      return { status: 'success', messageId: newMessage.id };
    } catch (error) {
      this.logger.error(
        `Error sending message from ${user.email}:`,
        error.message,
      );
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() bodyText: string,
  ) {
    this.logger.log(`Client ${client.id} joining room with body: ${bodyText}`);

    const user = (client as any).user as User;
    const body = JSON.parse(bodyText);

    try {
      // Tìm toUser nếu có toUserEmail
      let toUser: User | undefined;
      if (body.toUserEmail) {
        const foundUser = await this.userRepository.findOne({
          where: { email: body.toUserEmail },
        });
        toUser = foundUser === null ? undefined : foundUser;
      }

      const conversationId = await this.chatService.resolveConversationId({
        requester: user,
        isAdmin: user.role === UserRole.Staff,
        toUser: toUser,
        conversationId: body.conversationId,
      });

      this.joinConversation(client, conversationId, user.role);

      return { status: 'success', conversationId };
    } catch (error) {
      this.logger.error(`Error joining room for ${user.email}:`, error.message);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() bodyText: string,
  ) {
    this.logger.log(`Client ${client.id} leaving room with body: ${bodyText}`);

    const body = JSON.parse(bodyText);
    client.leave(`conversation:${body.conversationId}`);
    return { status: 'success', conversationId: body.conversationId };
  }

  @SubscribeMessage('typing')
  async onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    bodyText: string,
  ) {
    const user = (client as any).user as User;

    try {
      const body = JSON.parse(bodyText);

      // Tìm toUser nếu có toUserEmail
      let toUser: User | undefined;
      if (body.toUserEmail) {
        const foundUser = await this.userRepository.findOne({
          where: { email: body.toUserEmail },
        });
        toUser = foundUser === null ? undefined : foundUser;
      }

      const conversationId = await this.chatService.resolveConversationId({
        requester: user,
        isAdmin: user.role === UserRole.Staff,
        toUser: toUser,
        conversationId: body.conversationId,
      });

      this.logger.debug(
        `${user.email} typing in conversation ${conversationId}: ${body.isTyping}`,
      );

      this.server.to(`conversation:${conversationId}`).emit('typing', {
        fromEmail: user.email,
        isTyping: body.isTyping,
        conversationId: conversationId,
      });

      return { status: 'success', conversationId };
    } catch (error) {
      this.logger.error(
        `Error handling typing event from ${user.email}:`,
        error.message,
      );
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async onMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() bodyText: string,
  ) {
    const user = (client as any).user as User;

    try {
      const body = JSON.parse(bodyText);

      // Tìm toUser nếu có toUserEmail
      let toUser: User | undefined;
      if (body.toUserEmail) {
        const foundUser = await this.userRepository.findOne({
          where: { email: body.toUserEmail },
        });
        toUser = foundUser === null ? undefined : foundUser;
      }

      const conversationId = await this.chatService.resolveConversationId({
        requester: user,
        isAdmin: user.role === UserRole.Staff,
        toUser: toUser,
        conversationId: body.conversationId,
      });

      await this.chatService.markAsRead(conversationId, user);

      this.logger.log(
        `${user.email} marked conversation ${conversationId} as read`,
      );

      // Emit update to admin if user marked as read
      if (user.role !== UserRole.Staff) {
        const adminUser = await this.chatService.getAdminUser();
        this.server
          .to(`admin:${adminUser.email}`)
          .emit('conversationRead', { conversationId, userEmail: user.email });
      }

      return { status: 'success', conversationId };
    } catch (error) {
      this.logger.error(
        `Error marking conversation as read for ${user.email}:`,
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
