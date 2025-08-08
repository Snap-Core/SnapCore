import express from 'express';
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createCommunity,
  getCommunityByHandle,
  getExternalCommunityFromHandle,
  updateCommunity
} from "../controller/communityController";

const router = express.Router();

router.post("/:handle", authMiddleware, createCommunity);

router.patch("/:handle", authMiddleware, updateCommunity);

router.get("/:handle", authMiddleware, getCommunityByHandle);

router.get('/external', getExternalCommunityFromHandle);

export default router;