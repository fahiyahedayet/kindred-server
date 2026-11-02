import { Router } from "express";
import {
  getEvents,
  getMyEvents,
  createEvent,
  joinEvent,
  getJoinStatus,
  getJoinedEvents,
  leaveEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const eventRoutes = Router();

eventRoutes.get("/", getEvents);
eventRoutes.post("/", requireAuth, createEvent);
eventRoutes.post("/:id/join", requireAuth, joinEvent);
eventRoutes.get("/:id/join-status", requireAuth, getJoinStatus);
eventRoutes.get("/joined", requireAuth, getJoinedEvents);
eventRoutes.delete("/:id/leave", requireAuth, leaveEvent);
eventRoutes.get("/my-events", requireAuth, getMyEvents);
eventRoutes.delete("/:id", requireAuth, deleteEvent);


export default eventRoutes;