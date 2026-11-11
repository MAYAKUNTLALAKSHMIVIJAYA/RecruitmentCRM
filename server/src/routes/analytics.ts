import { Router } from 'express';
import { getReports } from '../controllers/analyticsController';
import { getTeamMembers } from '../controllers/teamController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/reports', getReports);
router.get('/team', getTeamMembers);

export default router;
