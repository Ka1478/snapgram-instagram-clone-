import express from "express";
import { getNotifications, markAllRead, markOneRead, deleteNotification } from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markOneRead);
router.delete("/:id", deleteNotification);

export default router;
