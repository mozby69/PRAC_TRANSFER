import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.routes'; // your existing routes
import path from 'path';

dotenv.config();
const app = express();
const server = http.createServer(app); // wrap express in HTTP server

// Setup CORS, body parser, cookies
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Use routes
app.use('/api/', authRoutes);



// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true, 
  },
});

// Save io instance globally (attach to app so controllers can access)
app.set("io", io);

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("join", ({ userId }) => {
    const room = `user_${userId}`;
    socket.join(room);
    console.log(`👤 User ${userId} joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// --- TEST ROUTE ---
app.get("/api/test-socket/:userId", (req, res) => {
  const { userId } = req.params;
  const room = `user_${userId}`;
  console.log(`📡 Emitting test event to ${room}`);

  io.to(room).emit("new_request", {
    requestId: 999,
    content: "Hello from /test-socket 🚀",
  });

  res.json({ ok: true, room });
});

// Start HTTP server
server.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5000');
});
