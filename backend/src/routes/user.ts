import express from 'express';
import {
  getCurrentUser,
  logout,
  updateUserController,
  getUserByUsername,
  getAllUsers, 
  searchUsers,
  getExternalUserFromUsername,
  getPublicUserProfile
} from "../controller/userController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", requireAuth, getCurrentUser);

router.post("/logout", requireAuth, logout);

router.patch("/", requireAuth, updateUserController);

router.get('/external', requireAuth, getExternalUserFromUsername);

router.get("/search", searchUsers);

router.get("/", requireAuth, getAllUsers);

router.get("/profile/:username", requireAuth, getUserByUsername);

router.get("/:username", getPublicUserProfile);

export default router;