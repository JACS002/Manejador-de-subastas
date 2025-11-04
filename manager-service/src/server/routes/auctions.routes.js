import express from "express";
import { AuctionsController } from "../controllers/auctions.controller.js";
const router = express.Router();

router.get("/", AuctionsController.list);

export default router;
