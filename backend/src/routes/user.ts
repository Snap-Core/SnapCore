import express from 'express';
import {
  getCurrentUser,
  logout,
  updateUserController,
  getUserByUsername,
  getAllUsers, 
  searchUsers,
  getExternalUserFromUsername
} from "../controller/userController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", requireAuth, getCurrentUser);

router.post("/logout", requireAuth, logout);

router.patch("/", requireAuth, updateUserController);

router.get('/external', getExternalUserFromUsername);

router.get("/search", searchUsers);

router.get("/", requireAuth, getAllUsers);

router.get("/:username", requireAuth, getUserByUsername);

export default router;