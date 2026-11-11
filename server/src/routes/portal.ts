import { Router } from 'express';
import {
  getPortalSubmissionByToken,
  submitPortalFeedback,
} from '../controllers/portalController';

const router = Router();

// Public routes – no authentication required, secured by review token
router.get('/submission/:token', getPortalSubmissionByToken);
router.post('/submission/:token/feedback', submitPortalFeedback);

export default router;
