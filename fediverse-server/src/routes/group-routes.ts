import express from 'express';
import {getExternalCommunityFromHandle, getGroupByHandle} from "../controllers/group-controller";
import {requireAuth} from "../middleware/auth-middleware";

const router = express.Router();

router.get('/external', requireAuth, getExternalCommunityFromHandle);
router.get('/:handle', getGroupByHandle);

export default router