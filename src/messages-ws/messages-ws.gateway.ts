import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true }) //cors: true allows all origins, you can specify specific origins if needed
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService, // Inject the JwtService to decode the token
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id); // Register the client with the decoded user ID
    } catch (error: any) {
      client.disconnect();
      return;
    }

    // console.log({ payload });

    // console.log('Client connected:', client.id);

    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  handleDisconnect(client: Socket) {
    // console.log('Client disconnected:', client.id);
    this.messagesWsService.removeClient(client.id);

    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    //! Emite unicamente al cliente, no a todos los clientes
    // client.emit('message-from-server', {
    //   fullName: 'Yo',
    //   message: payload.message || 'no message',
    // });

    //! Emite a todos los clientes, menos al cliente que lo emitió
    // client.broadcast.emit('message-from-server', {
    //   fullName: 'Yo',
    //   message: payload.message || 'no message',
    // });

    // this.wss.to() Es para emitir a un grupo de clientes, por ejemplo, a todos los clientes que están en una sala

    this.wss.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullNameBySocketId(client.id),
      message: payload.message || 'no message',
    });
  }
}
