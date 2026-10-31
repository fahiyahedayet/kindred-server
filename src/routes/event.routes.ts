
import { Router } from "express";
import { getEvents } from "../controllers/event.controller.js";

const eventRoutes = Router();

eventRoutes.get("/", getEvents);

export default eventRoutes;
