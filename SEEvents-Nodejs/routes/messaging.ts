import express from "express";
import { sendMessage, getChatHistory } from "../controllers/messagingController.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/:userId/:friendId", getChatHistory);

export default router;
