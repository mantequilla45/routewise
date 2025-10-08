import { Router } from "express";
import { getDummyData } from "../controllers/DummyController";

const router = Router();

router.get('/', getDummyData);

export default router;