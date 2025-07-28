import { Router } from 'express';
import { handleHealthCheck } from '../controller/handleHealthCheck';

const router = Router();

router.get('/', handleHealthCheck);

export default router;