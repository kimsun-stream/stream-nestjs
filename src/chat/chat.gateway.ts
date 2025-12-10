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
import { MessageDto } from './dto/message.dto';
import { CustomWsExceptionFilter } from 'src/common/filters/ws-exception.filter';

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
    const result = await this.chatService.getMessages(data.roomId, 1, 50);
    client.emit('messages', result);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: MessageDto, @ConnectedSocket() client: Socket) {
    console.log(data);
    const result = await this.chatService.sendMessage(data, client);
    this.server.to(data.roomId).emit('newMessage', result);
  }

  @SubscribeMessage('getMessages')
  async getMessages(
    @MessageBody() data: { roomId: string; page: number; limit: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.getMessages(data.roomId, data.page, data.limit);
  }
}
