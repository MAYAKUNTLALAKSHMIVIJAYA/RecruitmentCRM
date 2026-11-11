import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
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

// In production or single-service deployment, serve the built React frontend
const possibleClientPaths = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), '../client', 'dist'),
  path.join(__dirname, '../../client', 'dist'),
];
const clientDistPath = possibleClientPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[Static] Serving frontend static assets from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for unmatched API routes
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

  // Ensure Admin user Akhil exists
  const existingAkhil = await User.findOne({ email: 'akhil@recruitflow.com' });
  if (!existingAkhil) {
    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    await User.create({
      name: 'Akhil',
      email: 'akhil@recruitflow.com',
      password: hashedPassword,
      role: 'admin',
      designation: 'Managing Director & Lead Administrator',
      phone: '+91 98765 43210',
    });
    console.log('[Seed] Admin user Akhil created successfully (akhil@recruitflow.com / Admin@123)');
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
