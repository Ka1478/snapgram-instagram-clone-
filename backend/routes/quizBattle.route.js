import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { startBattle, joinBattle, submitAnswer, getGroupBattles } from "../controllers/quizBattle.controller.js";

const router = express.Router();
router.use(protect);

router.post("/start", startBattle);
router.post("/join/:battleId", joinBattle);
router.post("/answer/:battleId", submitAnswer);
router.get("/group/:groupId", getGroupBattles);

export default router;
