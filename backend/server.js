// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');
// const roomRoutes = require('./routes/rooms');

// const app = express();
// const server = http.createServer(app);

// // CORS configuration
// const corsOptions = {
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// };

// app.use(cors(corsOptions));
// app.use(express.json());

// // Socket.IO with CORS
// const io = socketIo(server, {
//   cors: {
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//     credentials: true
//   },
//   transports: ['websocket', 'polling'],
//   allowEIO3: true
// });

// // Health check
// app.get('/', (req, res) => {
//   res.json({ status: 'Server is running' });
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/rooms', roomRoutes);

// // Socket.io connection
// const activeUsers = {};

// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) return next(new Error('No token'));
  
//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return next(new Error('Invalid token'));
//     socket.user = user;
//     next();
//   });
// });

// io.on('connection', (socket) => {
//   console.log(`User ${socket.user.email} connected with socket ID: ${socket.id}`);
  
//   // Send current rooms status
//   socket.emit('rooms-update', getRoomCounts());
  
//   // Join room
//   socket.on('join-room', (roomName) => {
//     if (!activeUsers[roomName]) activeUsers[roomName] = [];
    
//     // Check if user already in room
//     const existingUser = activeUsers[roomName].find(u => u.socketId === socket.id);
//     if (!existingUser) {
//       activeUsers[roomName].push({
//         userId: socket.user.id,
//         email: socket.user.email,
//         socketId: socket.id
//       });
//     }
    
//     socket.join(roomName);
//     console.log(`User ${socket.user.email} joined ${roomName}`);
    
//     // Notify all clients in room
//     io.to(roomName).emit('room-update', {
//       users: activeUsers[roomName],
//       count: activeUsers[roomName].length
//     });
    
//     // Broadcast room counts to all users
//     io.emit('rooms-update', getRoomCounts());
//   });
  
//   // Leave room
//   socket.on('leave-room', (roomName) => {
//     if (activeUsers[roomName]) {
//       activeUsers[roomName] = activeUsers[roomName].filter(u => u.socketId !== socket.id);
//       if (activeUsers[roomName].length === 0) {
//         delete activeUsers[roomName];
//       }
//     }
//     socket.leave(roomName);
//     console.log(`User ${socket.user.email} left ${roomName}`);
    
//     io.to(roomName).emit('room-update', {
//       users: activeUsers[roomName] || [],
//       count: (activeUsers[roomName] || []).length
//     });
    
//     io.emit('rooms-update', getRoomCounts());
//   });
  
//   // Get rooms status
//   socket.on('get-rooms', () => {
//     socket.emit('rooms-update', getRoomCounts());
//   });
  
//   // WebRTC signaling
//   socket.on('send-signal', (data) => {
//     console.log(`Signal from ${socket.id} to ${data.targetSocketId}`);
//     io.to(data.targetSocketId).emit('receive-signal', {
//       signal: data.signal,
//       fromSocketId: socket.id,
//       fromEmail: socket.user.email
//     });
//   });
  
//   socket.on('return-signal', (data) => {
//     console.log(`Return signal from ${socket.id} to ${data.targetSocketId}`);
//     io.to(data.targetSocketId).emit('signal-returned', {
//       signal: data.signal,
//       fromSocketId: socket.id
//     });
//   });
  
//   socket.on('disconnect', () => {
//     Object.keys(activeUsers).forEach(room => {
//       if (activeUsers[room]) {
//         activeUsers[room] = activeUsers[room].filter(u => u.socketId !== socket.id);
//         if (activeUsers[room].length === 0) {
//           delete activeUsers[room];
//         } else {
//           io.to(room).emit('room-update', {
//             users: activeUsers[room],
//             count: activeUsers[room].length
//           });
//         }
//       }
//     });
//     io.emit('rooms-update', getRoomCounts());
//     console.log(`User ${socket.user.email} disconnected`);
//   });
// });

// function getRoomCounts() {
//   return {
//     'Resume Team': activeUsers['Resume Team']?.length || 0,
//     'Technical Recruiter Team': activeUsers['Technical Recruiter Team']?.length || 0,
//     'Tea Break': activeUsers['Tea Break']?.length || 0,
//     'Lunch Break': activeUsers['Lunch Break']?.length || 0
//   };
// }

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://localhost:${PORT}`);
//   console.log(`Socket.IO ready for connections from http://localhost:5173`);
// });


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const os = require('os');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// Detect local LAN IP (auto-detect)
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
const LAN_IP = getLocalIP();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  `http://${LAN_IP}:5173`
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const activeUsers = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`✅ User ${socket.user.email} connected [${socket.id}]`);

  socket.emit('rooms-update', getRoomCounts());

  socket.on('join-room', (roomName) => {
    if (!activeUsers[roomName]) activeUsers[roomName] = [];
    const existing = activeUsers[roomName].find(u => u.socketId === socket.id);
    if (!existing) {
      activeUsers[roomName].push({
        userId: socket.user.id,
        email: socket.user.email,
        socketId: socket.id
      });
    }

    socket.join(roomName);
    console.log(`📦 ${socket.user.email} joined ${roomName}`);

    io.to(roomName).emit('room-update', {
      users: activeUsers[roomName],
      count: activeUsers[roomName].length
    });
    io.emit('rooms-update', getRoomCounts());
  });

  socket.on('leave-room', (roomName) => {
    if (activeUsers[roomName]) {
      activeUsers[roomName] = activeUsers[roomName].filter(u => u.socketId !== socket.id);
      if (activeUsers[roomName].length === 0) delete activeUsers[roomName];
    }
    socket.leave(roomName);
    console.log(`🚪 ${socket.user.email} left ${roomName}`);
    io.emit('rooms-update', getRoomCounts());
  });

  socket.on('send-signal', (data) => {
    io.to(data.targetSocketId).emit('receive-signal', {
      signal: data.signal,
      fromSocketId: socket.id,
      fromEmail: socket.user.email
    });
  });

  socket.on('return-signal', (data) => {
    io.to(data.targetSocketId).emit('signal-returned', {
      signal: data.signal,
      fromSocketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    for (const room of Object.keys(activeUsers)) {
      activeUsers[room] = activeUsers[room].filter(u => u.socketId !== socket.id);
      if (activeUsers[room].length === 0) delete activeUsers[room];
    }
    io.emit('rooms-update', getRoomCounts());
    console.log(`❌ ${socket.user.email} disconnected`);
  });
});

function getRoomCounts() {
  return {
    'Resume Team': activeUsers['Resume Team']?.length || 0,
    'Technical Recruiter Team': activeUsers['Technical Recruiter Team']?.length || 0,
    'Tea Break': activeUsers['Tea Break']?.length || 0,
    'Lunch Break': activeUsers['Lunch Break']?.length || 0
  };
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('---------------------------------------------------');
  console.log(`✅ Server running on:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Network: http://${LAN_IP}:${PORT}`);
  console.log('---------------------------------------------------');
});
