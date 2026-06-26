import { Router, type IRouter } from "express";
import healthRouter from "./health";
import giftedRouter from "./gifted";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/gifted", giftedRouter);

export default router;
