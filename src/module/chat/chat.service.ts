import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Conversation } from './entities/conversation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  LessThan,
  Repository,
} from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageStatus } from './enums/message-status.enum';
import { ListConversationsDto } from './dtos/list-conversation.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { User } from 'src/module/users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    private readonly config: ConfigService,

    private readonly paginationProvider: PaginationProvider,

    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAdminUser(): Promise<User> {
    const envEmail = this.config.get<string>('ADMIN_EMAIL');
    const adminEmail = envEmail || 'test@gmail.com';

    const adminUser = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      throw new NotFoundException(
        `Admin user with email ${adminEmail} not found`,
      );
    }

    return adminUser;
  }

  async getOrCreateConversation(user: User) {
    const adminUser = await this.getAdminUser();

    if (user.id === adminUser.id) {
      throw new BadRequestException(
        'Admin cannot create conversation with themselves',
      );
    }

    const now = new Date();
    const conversation = await this.conversationRepository.findOne({
      where: {
        user: { id: user.id },
        admin: { id: adminUser.id },
      },
    });

    if (conversation) return conversation;

    const newConversation = this.conversationRepository.create({
      user: user,
      admin: adminUser,
      unreadForAdmin: 0,
      unreadForUser: 0,
      lastMessageText: '',
      lastMessageFromEmail: user.email,
      lastMessageAt: now,
    });

    return this.conversationRepository.save(newConversation);
  }

  async resolveConversationId(params: {
    requester: User;
    isAdmin: boolean;
    toUser?: User;
    conversationId?: string;
  }): Promise<string> {
    const adminUser = await this.getAdminUser();

    if (params.conversationId) {
      const conv = await this.conversationRepository.findOne({
        where: { id: params.conversationId },
        relations: ['user', 'admin'],
      });

      if (!conv) {
        throw new NotFoundException(
          `Conversation with id ${params.conversationId} not found`,
        );
      }

      this.ensureAccessOrThrow(conv, params.requester, adminUser);
      return conv.id.toString();
    }

    if (!params.isAdmin) {
      const conv = await this.getOrCreateConversation(params.requester);
      return conv.id.toString();
    }

    if (!params.toUser) {
      throw new BadRequestException(
        'toUser is required when requester is admin',
      );
    }

    const conv = await this.getOrCreateConversation(params.toUser);
    this.ensureAccessOrThrow(conv, params.requester, adminUser);
    return conv.id.toString();
  }

  async sendMessage(args: {
    sender: User;
    text: string;
    isAdminSender: boolean;
    toUser?: User;
    conversationId?: string;
  }) {
    const adminUser = await this.getAdminUser();
    const convId = await this.resolveConversationId({
      requester: args.sender,
      isAdmin: args.isAdminSender,
      toUser: args.toUser,
      conversationId: args.conversationId,
    });

    const conv = await this.conversationRepository.findOne({
      where: { id: convId },
      relations: ['user', 'admin'],
    });

    if (!conv) {
      throw new BadRequestException('Conversation not found');
    }

    const toUser = args.isAdminSender ? conv.user : adminUser;

    const newMessage = this.messageRepository.create({
      conversationId: convId,
      fromEmail: args.sender.email,
      toEmail: toUser.email,
      text: args.text,
      status: MessageStatus.SENT,
    });

    await Promise.all([
      this.messageRepository.save(newMessage),
      this.conversationRepository.update(convId, {
        lastMessageText: args.text,
        lastMessageFromEmail: args.sender.email,
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

  async listConversationsForAdmin(
    listConversationsDto: ListConversationsDto,
  ): Promise<Paginated<Conversation>> {
    const { search, ...pagination } = listConversationsDto;

    const adminUser = await this.getAdminUser();

    // Build where condition
    const where: FindOptionsWhere<Conversation> = {
      admin: { id: adminUser.id },
    };

    if (search) {
      where.user = {
        email: ILike(`%${search}%`),
      };
    }

    // Ưu tiên lastMessageAt, sau đó updatedAt
    const order: FindOptionsOrder<Conversation> = {
      lastMessageAt: 'DESC',
      updatedAt: 'DESC',
    };

    // Gọi provider paginateQuery giống như getAllBooking
    return await this.paginationProvider.paginateQuery(
      pagination,
      this.conversationRepository,
      where,
      order,
      ['user', 'admin'], // Include relations
    );
  }

  async getMessages(conversationId: string, getMessagesDto: GetMessagesDto) {
    const { limit } = getMessagesDto;

    const where: FindOptionsWhere<Message> = {
      conversation: { id: conversationId },
    };

    const items = await this.messageRepository.find({
      where,
      order: { createdAt: 'ASC' },
      take: limit,
    });

    return { items };
  }

  async markAsRead(conversationId: string, requester: User) {
    const adminUser = await this.getAdminUser();
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user', 'admin'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    this.ensureAccessOrThrow(conversation, requester, adminUser);

    const isAdmin = requester.id === adminUser.id;
    const updateField = isAdmin ? 'unreadForAdmin' : 'unreadForUser';

    await this.conversationRepository.update(conversationId, {
      [updateField]: 0,
    });
  }

  private ensureAccessOrThrow(
    conversation: Conversation,
    requester: User,
    adminUser: User,
  ) {
    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    const hasAccess =
      conversation.user.id === requester.id ||
      (conversation.admin.id === adminUser.id && requester.id === adminUser.id);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this conversation');
    }
  }
}
