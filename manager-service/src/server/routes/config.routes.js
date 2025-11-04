import express from "express";
import { ConfigController } from "../controllers/config.controller.js";
const router = express.Router();

router.get("/", ConfigController.get);
router.post("/", ConfigController.save);

export default router;
