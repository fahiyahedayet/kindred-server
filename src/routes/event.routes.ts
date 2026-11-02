
import { Router } from "express";
import {
  getEvents,
  createEvent,
} from "../controllers/event.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const eventRoutes = Router();

eventRoutes.get("/", getEvents);
eventRoutes.post("/", requireAuth, createEvent);

export default eventRoutes;
