import express from 'express';
import {getGroupByHandle} from "../controllers/group-controller";

const router = express.Router();

router.get('/:handle', getGroupByHandle);

export default router