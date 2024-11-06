import { Router } from "express";
import { facebookOauth } from "../api/facebookOauth";

const router = Router();

router.post("/facebook-oauth", facebookOauth);

export default router;
