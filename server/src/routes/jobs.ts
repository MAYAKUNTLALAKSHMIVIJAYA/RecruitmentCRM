import { Router } from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
} from '../controllers/jobController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getJobs);
router.post('/', createJob);
router.get('/:id', getJobById);
router.put('/:id', updateJob);

export default router;
