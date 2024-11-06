import { Router } from "express";
import { hasActivePlan } from "../api/hasActivePlan";

const router = Router();
router.get("/has-active-plan", hasActivePlan);

export default router;
