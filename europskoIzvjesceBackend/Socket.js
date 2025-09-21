const { Server } = require('socket.io');

const sessions = {};

function initializeSocket(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on('connection', (socket) => {
    console.log("Socket connected:", socket.id);

    socket.onAny((event, ...args) => {
      console.log('SOCKET EVENT:', event, JSON.stringify(args, null, 2));
    });

    let currentSession = null;
    let currentRole = null;

    socket.on('join-session', ({ sessionId }) => {
      currentSession = sessionId;
      if (!sessions[sessionId]) sessions[sessionId] = {};

      // Dodjela role A ili B
      currentRole = !sessions[sessionId].A ? 'A' : !sessions[sessionId].B ? 'B' : null;
      if (!currentRole) {
        socket.join(sessionId);
        socket.emit('role-assigned', { role: null });
        return;
      }

      sessions[sessionId][currentRole] = {
        socketId: socket.id,
        confirmed: false,
        completed: false,
        data: {}
      };

      socket.join(sessionId);
      socket.emit('role-assigned', { role: currentRole });

      // Peer sync
      if (currentRole === 'B') socket.to(sessionId).emit('peer-joined');
      if (currentRole === 'A' && sessions[sessionId].B) socket.emit('peer-joined');

      io.to(sessionId).emit('peer-status-update', sessions[sessionId]);

      socket.on('form-completed', (formData) => {
        sessions[sessionId][currentRole].completed = true;
        sessions[sessionId][currentRole].data = formData;
        if (sessions[sessionId].A?.completed && sessions[sessionId].B?.completed) {
          io.to(sessionId).emit('pdf-confirmation-ready');
        }
        io.to(sessionId).emit('peer-status-update', sessions[sessionId]);
      });

      socket.on('confirm-send-pdf', () => {
        sessions[sessionId][currentRole].confirmed = true;
        io.to(sessionId).emit('peer-status-update', sessions[sessionId]);
        if (sessions[sessionId].A?.confirmed && sessions[sessionId].B?.confirmed) {
          io.to(sessionId).emit('pdf-sent');
          delete sessions[sessionId];
        }
      });

      socket.on('disconnect', () => {
        delete sessions[sessionId][currentRole];
        if (!sessions[sessionId].A && !sessions[sessionId].B) {
          delete sessions[sessionId];
        }
        io.to(sessionId).emit('peer-status-update', sessions[sessionId]);
      });
    });
  });

  return io;
}

module.exports = initializeSocket;
