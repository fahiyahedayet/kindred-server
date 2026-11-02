import { Router } from "express";
import {
  getEvents,
  createEvent,
  joinEvent,
  getJoinStatus,
} from "../controllers/event.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const eventRoutes = Router();

eventRoutes.get("/", getEvents);
eventRoutes.post("/", requireAuth, createEvent);
eventRoutes.post("/:id/join", requireAuth, joinEvent);
eventRoutes.get("/:id/join-status", requireAuth, getJoinStatus);

export default eventRoutes;