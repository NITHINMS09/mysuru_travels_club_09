import { Server as SocketServer, Socket } from 'socket.io';
import prisma from '../config/database';

export function initializeSocket(io: SocketServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join trip chat room
    socket.on('join_trip_chat', async (data: { tripId: string; userName: string; userEmail: string }) => {
      const { tripId, userName } = data;
      socket.join(`trip_${tripId}`);
      socket.data = { ...data };
      
      io.to(`trip_${tripId}`).emit('user_joined', {
        userName,
        message: `${userName} joined the chat`,
        timestamp: new Date().toISOString(),
      });

      // Send online users
      const room = io.sockets.adapter.rooms.get(`trip_${tripId}`);
      const onlineUsers: string[] = [];
      if (room) {
        for (const sid of room) {
          const s = io.sockets.sockets.get(sid);
          if (s?.data?.userName) onlineUsers.push(s.data.userName);
        }
      }
      io.to(`trip_${tripId}`).emit('online_users', onlineUsers);
    });

    // Send message
    socket.on('send_message', async (data: {
      tripId: string;
      senderName: string;
      senderEmail: string;
      content: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      replyToId?: string;
    }) => {
      try {
        const message = await prisma.chatMessage.create({
          data: {
            tripId: data.tripId,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            content: data.content,
            type: (data.type as any) || 'TEXT',
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            replyToId: data.replyToId || null,
          },
        });
        io.to(`trip_${data.tripId}`).emit('new_message', message);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Edit message
    socket.on('edit_message', async (data: { messageId: string; tripId: string; content: string }) => {
      try {
        const message = await prisma.chatMessage.update({
          where: { id: data.messageId },
          data: { content: data.content, isEdited: true },
        });
        io.to(`trip_${data.tripId}`).emit('message_edited', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Pin message
    socket.on('pin_message', async (data: { messageId: string; tripId: string; pinned: boolean }) => {
      try {
        const message = await prisma.chatMessage.update({
          where: { id: data.messageId },
          data: { pinned: data.pinned },
        });
        io.to(`trip_${data.tripId}`).emit('message_pinned', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to pin message' });
      }
    });

    // Create poll
    socket.on('create_poll', async (data: {
      tripId: string;
      senderName: string;
      senderEmail: string;
      question: string;
      options: string[];
    }) => {
      try {
        const pollData = {
          question: data.question,
          options: data.options.map((opt: string) => ({ text: opt, votes: [] as string[] })),
        };
        const message = await prisma.chatMessage.create({
          data: {
            tripId: data.tripId,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            content: data.question,
            type: 'POLL',
            pollData: pollData as any,
          },
        });
        io.to(`trip_${data.tripId}`).emit('new_message', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create poll' });
      }
    });

    // Vote on poll
    socket.on('vote_poll', async (data: {
      messageId: string;
      tripId: string;
      optionIndex: number;
      voterEmail: string;
    }) => {
      try {
        const message = await prisma.chatMessage.findUnique({ where: { id: data.messageId } });
        if (!message || !message.pollData) return;
        
        const pollData = message.pollData as any;
        // Remove previous vote
        pollData.options.forEach((opt: any) => {
          opt.votes = opt.votes.filter((v: string) => v !== data.voterEmail);
        });
        // Add new vote
        pollData.options[data.optionIndex].votes.push(data.voterEmail);
        
        await prisma.chatMessage.update({
          where: { id: data.messageId },
          data: { pollData: pollData as any },
        });
        
        io.to(`trip_${data.tripId}`).emit('poll_updated', { messageId: data.messageId, pollData });
      } catch (error) {
        socket.emit('error', { message: 'Failed to vote' });
      }
    });

    // Admin announcement
    socket.on('announcement', async (data: {
      tripId: string;
      senderName: string;
      senderEmail: string;
      content: string;
    }) => {
      try {
        const message = await prisma.chatMessage.create({
          data: {
            tripId: data.tripId,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            content: data.content,
            type: 'ANNOUNCEMENT',
            pinned: true,
          },
        });
        io.to(`trip_${data.tripId}`).emit('new_message', message);
        io.to(`trip_${data.tripId}`).emit('announcement', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send announcement' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { tripId: string; userName: string }) => {
      socket.to(`trip_${data.tripId}`).emit('user_typing', { userName: data.userName });
    });

    // Stop typing
    socket.on('stop_typing', (data: { tripId: string; userName: string }) => {
      socket.to(`trip_${data.tripId}`).emit('user_stop_typing', { userName: data.userName });
    });

    // Delete message (admin)
    socket.on('delete_message', async (data: { messageId: string; tripId: string }) => {
      try {
        await prisma.chatMessage.update({
          where: { id: data.messageId },
          data: { deleted: true, content: 'This message was deleted by admin' },
        });
        io.to(`trip_${data.tripId}`).emit('message_deleted', { messageId: data.messageId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.data?.tripId) {
        socket.to(`trip_${socket.data.tripId}`).emit('user_left', {
          userName: socket.data.userName,
          message: `${socket.data.userName} left the chat`,
        });
      }
    });
  });
}
