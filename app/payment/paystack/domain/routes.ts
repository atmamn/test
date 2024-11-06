import { Router } from "express";
import { callback } from "../api/callBack";
import { oneMonth } from "../api/plans";
import { cancel } from "../api/cancel";

const router = Router();

router.get("/payment", oneMonth);
router.get("/callbackx", callback);
router.get("/cancelurl", cancel);

export default router;
