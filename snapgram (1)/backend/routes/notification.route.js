import express from "express";
import { getNotifications, markAllRead, getUnreadCount } from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread/count", getUnreadCount);
router.put("/read-all", markAllRead);

export default router;
