import { Router } from 'express';
import {
  getDashboardStats,
  getDashboardCharts,
  getAttentionRequired,
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/urgent-actions', getAttentionRequired);

export default router;
