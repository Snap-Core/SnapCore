import { Router } from "express";
import { handleGoogleAuthToken } from "../controller/googleAuth";

const router = Router();

router.post("/google-login", handleGoogleAuthToken);

export default router;