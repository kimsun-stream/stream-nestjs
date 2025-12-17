import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
import { UseFilters } from '@nestjs/common';
import { CustomWsExceptionFilter } from 'src/common/filters/ws-exception.filter';
import { GetMessagesDto, SendMessageDto } from './dto/message.dto';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
@UseFilters(new CustomWsExceptionFilter())
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    console.log('connected' + client.id);
  }
  async handleDisconnect(client: Socket) {
    console.log('disconnected' + client.id);
  }

  @SubscribeMessage('joinChatRoom')
  async handleJoinChatRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    client.emit('joined', { roomId: data.roomId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: SendMessageDto, @ConnectedSocket() client: Socket) {
    console.log(data);
    const result = await this.chatService.sendMessage(data, client);
    this.server.to(data.roomId).emit('newMessage', result);
  }

  @SubscribeMessage('getMessages')
  async getMessages(@MessageBody() dto: GetMessagesDto, @ConnectedSocket() client: Socket) {
    const messages = await this.chatService.getMessages(dto);
    client.emit('messages', messages);
  }
}
