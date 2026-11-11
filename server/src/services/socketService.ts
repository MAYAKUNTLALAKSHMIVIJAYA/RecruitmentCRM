import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const initSocket = (io: SocketIOServer): void => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_user', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export const emitEvent = (event: string, data: any, targetUserId?: string): void => {
  if (!ioInstance) return;
  if (targetUserId) {
    ioInstance.to(`user_${targetUserId}`).emit(event, data);
  } else {
    ioInstance.emit(event, data);
  }
};
