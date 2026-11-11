import { Router } from 'express';
import {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmissionStatus,
  getSubmissionTimeline,
} from '../controllers/submissionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSubmissions);
router.post('/', createSubmission);
router.get('/:id', getSubmissionById);
router.put('/:id', updateSubmissionStatus);
router.get('/:id/timeline', getSubmissionTimeline);

export default router;
