import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { config } from './config/config';
import { connectDB } from './config/db';
import { initSocket } from './services/socketService';
import { setupCronJobs } from './jobs/cronJobs';

// Routes
import authRoutes from './routes/auth';
import candidateRoutes from './routes/candidates';
import clientRoutes from './routes/clients';
import jobRoutes from './routes/jobs';
import submissionRoutes from './routes/submissions';
import followupRoutes from './routes/followups';
import emailRoutes from './routes/emails';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import portalRoutes from './routes/portal';
import analyticsRoutes from './routes/analytics';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocket(io);

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded resumes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', app: 'RecruitFlow CRM Backend', version: '1.0.0', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api', analyticsRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Error Handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
});

const bootstrap = async () => {
  await connectDB();

  // Check for existing data; seed if empty
  const { User } = await import('./models/User');
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Seed] Database is empty. Running demo seed data...');
    const { seedDatabase } = await import('./utils/seed');
    await seedDatabase();
  } else {
    console.log(`[Seed] Database already has ${userCount} users. Skipping seed.`);
  }

  setupCronJobs();

  httpServer.listen(config.port, () => {
    console.log(
      `\n🚀 RecruitFlow CRM Backend running on http://localhost:${config.port}\n` +
      `📊 Dashboard: ${config.clientUrl}\n` +
      `🔌 Socket.IO: enabled\n` +
      `📧 Email mode: Simulated (all emails are logged, not delivered)\n`
    );
  });
};

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
