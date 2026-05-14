import { io, type Socket } from 'socket.io-client';

let boardSocket: Socket | null = null;

export function getBoardSocket(): Socket {
  if (!boardSocket) {
    boardSocket = io('/board', { withCredentials: true, autoConnect: false });
  }
  return boardSocket;
}

export function joinBoard(boardId: string) {
  const socket = getBoardSocket();
  if (!socket.connected) socket.connect();
  socket.emit('board:join', boardId);
}

export function leaveBoard(boardId: string) {
  const socket = getBoardSocket();
  socket.emit('board:leave', boardId);
}
