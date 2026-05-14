import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from './logger.js';

let io: SocketServer;

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  const board = io.of('/board');

  board.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected to /board');

    socket.on('board:join', (boardId: string) => {
      void socket.join(`board:${boardId}`);
      logger.debug({ socketId: socket.id, boardId }, 'Socket joined board room');
    });

    socket.on('board:leave', (boardId: string) => {
      void socket.leave(`board:${boardId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

export function getSocketServer(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket first');
  return io;
}

export function emitBoardEvent(
  boardId: string,
  event: 'card:moved' | 'card:created' | 'card:deleted' | 'card:updated',
  data: unknown,
) {
  if (!io) return;
  io.of('/board').to(`board:${boardId}`).emit(event, data);
}
