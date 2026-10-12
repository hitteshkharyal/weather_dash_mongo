require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server: SocketServer } = require('socket.io');

const connectDB = require('./config/db');
const seedAdmin = require('./seed');

// Services
const { inferWeather } = require('./services/weatherInference');
const { shouldBroadcast } = require('./services/broadcastFilter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sensorRoutes = require('./routes/sensorRoutes');

// ─── Express App ──────────────────────────────────────────────

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Socket.io ────────────────────────────────────────────────

const io = new SocketServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 200 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// ─── Wire Services into App ──────────────────────────────────

// Make the inference engine available to controllers
app.locals.inferWeather = inferWeather;

// Broadcast function used by sensorController after ingestion
app.locals.broadcastReading = (siteId, data) => {
  const { shouldBroadcast: shouldEmit, changes } = shouldBroadcast(siteId, data);

  if (shouldEmit) {
    // Emit to the site-specific room
    io.to(`site:${siteId}`).emit('sensorUpdate', {
      siteId,
      data,
      changes,
      timestamp: data.timestamp || new Date(),
    });

    console.log(`📡 Broadcast to site:${siteId} — condition: ${data.inferredCondition}`);
  }
};

// ─── Socket.io Connection Handling ───────────────────────────

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Clients join a room for their selected site
  socket.on('joinSite', (siteId) => {
    socket.join(`site:${siteId}`);
    console.log(`👁  Socket ${socket.id} joined site:${siteId}`);
  });

  socket.on('leaveSite', (siteId) => {
    socket.leave(`site:${siteId}`);
    console.log(`👁  Socket ${socket.id} left site:${siteId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── API Routes ──────────────────────────────────────────────

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Weather Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/sensors', sensorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ─── Start Server ────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedAdmin();

  server.listen(PORT, () => {
    console.log(`\n🌤  Weather Dashboard API`);
    console.log(`   ➜ http://localhost:${PORT}`);
    console.log(`   ➜ Health: http://localhost:${PORT}/api/v1/health`);
    console.log(`   ➜ Socket.io: ws://localhost:${PORT}`);
    console.log(`   ➜ Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

start();
