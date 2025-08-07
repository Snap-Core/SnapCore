import express from 'express';
import { requireAuth } from "../middleware/authMiddleware";
import {
  createCommunity,
  getCommunityByHandle,
  getExternalCommunityFromHandle,
  updateCommunity
} from "../controller/communityController";

const router = express.Router();

router.post("/:handle", requireAuth, createCommunity);

router.patch("/:handle", requireAuth, updateCommunity);

router.get("/:handle", requireAuth, getCommunityByHandle);

router.get('/external', getExternalCommunityFromHandle);

export default router;