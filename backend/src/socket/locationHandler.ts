import { Server, Socket } from 'socket.io';
import prisma from '../config/database';

export const initializeLocationSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Admin starts sharing live location
    socket.on('start_live_tracking', async ({ tripId, lat, lng }) => {
      try {
        await prisma.trip.update({
          where: { id: tripId },
          data: { isLiveTracking: true, currentLat: lat, currentLng: lng }
        });
        socket.join(`trip_location_${tripId}`);
        io.to(`trip_location_${tripId}`).emit('location_started', { tripId, lat, lng });
      } catch (err) {
        console.error('Start tracking error:', err);
      }
    });

    // Update location
    socket.on('update_location', async ({ tripId, lat, lng }) => {
      try {
        await prisma.trip.update({
          where: { id: tripId },
          data: { currentLat: lat, currentLng: lng }
        });
        io.to(`trip_location_${tripId}`).emit('location_updated', { lat, lng });
      } catch (err) {
        console.error('Update location error:', err);
      }
    });

    // Join trip location room
    socket.on('join_trip_location', (tripId) => {
      socket.join(`trip_location_${tripId}`);
    });

    socket.on('stop_live_tracking', async (tripId) => {
      try {
        await prisma.trip.update({
          where: { id: tripId },
          data: { isLiveTracking: false }
        });
        io.to(`trip_location_${tripId}`).emit('location_stopped', tripId);
      } catch (err) {
        console.error('Stop tracking error:', err);
      }
    });
  });
};
