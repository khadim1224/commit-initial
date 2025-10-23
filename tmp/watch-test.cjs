const io = require('socket.io-client');
const argCode = process.argv[2];
const url = process.env.SOCKET_URL || 'http://localhost:3001';
const socket = io(url);

function watch(code) {
  console.log('attempting watch-room for', code);
  socket.emit('watch-room', { roomCode: code });
}

socket.on('connect', () => {
  console.log('client connected:', socket.id, 'to', url);
  if (argCode) {
    watch(argCode);
  } else {
    console.log('no code provided, creating a room');
    socket.emit('create-room', 'Test Host');
  }
});

socket.on('room-created', (data) => {
  console.log('room-created:', data.roomCode);
  watch(data.roomCode);
});

socket.on('room-watched', (data) => {
  console.log('room-watched:', data.roomCode, !!data.room, data.room?.gameState);
  process.exit(0);
});

socket.on('error', (e) => {
  console.log('server error:', e);
  process.exit(1);
});

setTimeout(() => {
  console.log('timeout waiting for room-watched');
  process.exit(2);
}, 8000);