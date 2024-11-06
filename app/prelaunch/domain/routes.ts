import { Router } from "express";
import { registerUser } from "../api/register";
import { stripeSubscription } from "../api/stripe";
import { userProfile } from "../api/userProfile";
const router = Router();

router.post("/register", registerUser);
router.post("/stripe-subscription", stripeSubscription);
router.get("/user-profile", userProfile);

export default router;
