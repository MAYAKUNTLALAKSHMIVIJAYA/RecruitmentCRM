import { Router } from 'express';
import {
  getEmailLogs,
  getTemplates,
  sendManualEmail,
} from '../controllers/emailController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getEmailLogs);
router.get('/templates', getTemplates);
router.post('/send', sendManualEmail);

export default router;
