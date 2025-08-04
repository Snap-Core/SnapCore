import express from 'express';
import { getCurrentUser, logout, updateUserController, getUserByUsername } from "../controller/userController";
import { requireAuth } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/me", requireAuth, getCurrentUser);

router.post("/logout", requireAuth, logout);

router.patch("/", requireAuth, updateUserController);

router.get("/by-username/:username", requireAuth, getUserByUsername);

export default router;