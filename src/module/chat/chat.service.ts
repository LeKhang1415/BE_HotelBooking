import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Conversation } from './entities/conversation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageStatus } from './enums/message-status.enum';

@Injectable()
export class ChatService {
  constructor(
    private readonly config: ConfigService,

    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async getAdminEmail(): Promise<string> {
    const envEmail = this.config.get<string>('ADMIN_EMAIL');
    if (envEmail) return envEmail;

    return 'test@gmail.com';
  }
  async getOrCreateConversation(userEmail: string) {
    const adminEmail = await this.getAdminEmail();

    const now = new Date();

    const conversation = await this.conversationRepository.findOne({
      where: [
        { userEmail, adminEmail },
        { userEmail: adminEmail, adminEmail: userEmail },
      ],
    });

    if (conversation) return conversation;

    const newConversation = this.conversationRepository.create({
      userEmail,
      adminEmail,
      unreadForAdmin: 0,
      unreadForUser: 0,
      lastMessageText: '',
      lastMessageFromEmail: '',
      lastMessageAt: now,
    });
    return this.conversationRepository.save(newConversation);
  }

  async resolveConversationId(params: {
    requesterEmail: string;
    isAdmin: boolean;
    toUserEmail?: string;
    conversationId?: string;
  }): Promise<string> {
    const adminEmail = await this.getAdminEmail();

    if (params.conversationId) {
      const conv = await this.conversationRepository.findOne({
        where: { id: params.conversationId },
      });

      if (!conv) {
        throw new NotFoundException(
          `Conversation with id ${params.conversationId} not found`,
        );
      }

      this.ensureAccessOrThrow(conv, params.requesterEmail, adminEmail);
      return conv.id.toString();
    }

    if (!params.isAdmin) {
      const conv = await this.getOrCreateConversation(params.requesterEmail);
      return conv.id.toString();
    }

    if (!params.toUserEmail) {
      throw new BadRequestException(
        'toUserEmail is required when requester is admin',
      );
    }

    const conv = await this.getOrCreateConversation(params.toUserEmail);
    this.ensureAccessOrThrow(conv, params.requesterEmail, adminEmail);
    return conv.id.toString();
  }
  async sendMessage(args: {
    senderEmail: string;
    text: string;
    isAdminSender: boolean;
    toUserEmail?: string;
    conversationId?: string;
  }) {
    const adminEmail = await this.getAdminEmail();
    const convId = await this.resolveConversationId({
      requesterEmail: args.senderEmail,
      isAdmin: args.isAdminSender,
      toUserEmail: args.toUserEmail,
      conversationId: args.conversationId,
    });

    const conv = await this.conversationRepository.findOne({
      where: { id: convId },
    });

    if (!conv) {
      throw new BadRequestException('Conversation not found');
    }

    const toEmail = args.isAdminSender ? conv.userEmail : adminEmail;

    const newMessage = this.messageRepository.create({
      conversationId: convId,
      fromEmail: args.senderEmail,
      toEmail,
      text: args.text,
      status: MessageStatus.SENT,
    });
    await Promise.all([
      this.messageRepository.save(newMessage),
      this.conversationRepository.update(convId, {
        lastMessageText: args.text,
        lastMessageFromEmail: args.senderEmail,
        lastMessageAt: new Date(),
      }),
      // Tăng unread cho bên nhận
      this.conversationRepository.increment(
        { id: convId },
        args.isAdminSender ? 'unreadForUser' : 'unreadForAdmin',
        1,
      ),
    ]);

    return newMessage;
  }

  private ensureAccessOrThrow(
    conversation: Conversation,
    requesterEmail: string,
    adminEmail: string,
  ) {
    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }
    if (
      conversation.userEmail !== requesterEmail &&
      conversation.adminEmail !== adminEmail
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }
  }
}
