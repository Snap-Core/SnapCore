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
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", authMiddleware, getCurrentUser);

router.post("/logout", authMiddleware, logout);

router.patch("/", authMiddleware, updateUserController);

router.get('/external', authMiddleware, getExternalUserFromUsername);

router.get("/search", searchUsers);

router.get("/", authMiddleware, getAllUsers);

router.get("/:username", authMiddleware, getUserByUsername);

export default router;