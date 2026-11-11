import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  addHiringManager,
  getHiringManagers,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/hiring-managers', getHiringManagers);
router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.post('/:clientId/hiring-managers', addHiringManager);

export default router;
