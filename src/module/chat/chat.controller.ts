import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { ListConversationsDto } from './dtos/list-conversation.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':conversationId/messages')
  async getMessages() {}

  @Get()
  @Roles(UserRole.Staff)
  async list(@Query() listConversationsDto: ListConversationsDto) {
    return this.chatService.listConversationsForAdmin(listConversationsDto);
  }
}
