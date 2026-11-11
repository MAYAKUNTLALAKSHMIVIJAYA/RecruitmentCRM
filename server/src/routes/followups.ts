import { Router } from 'express';
import {
  getFollowUps,
  createFollowUp,
  sendFollowUpEmail,
  snoozeFollowUp,
  escalateFollowUp,
  completeFollowUp,
  triggerReminderScan,
} from '../controllers/followupController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.post('/scan', triggerReminderScan);
router.post('/:id/send', sendFollowUpEmail);
router.post('/:id/snooze', snoozeFollowUp);
router.post('/:id/escalate', escalateFollowUp);
router.post('/:id/complete', completeFollowUp);

export default router;
