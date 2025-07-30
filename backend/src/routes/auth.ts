import { Router } from "express";
import { handleGoogleAuthToken, getCurrentUser, logout } from "../controller/googleAuth";

const router = Router();


router.post("/google-login", handleGoogleAuthToken);

router.get("/me", getCurrentUser);

router.post("/logout", logout);

export default router;