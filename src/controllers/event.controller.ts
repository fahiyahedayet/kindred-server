
import { Request, Response } from "express";
import { getCollections } from "../config/collections.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { events } = await getCollections();

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : "";

    const filter: Record<string, unknown> = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    const eventList = await events
      .find(filter)
      .sort({ eventDate: 1 })
      .toArray();

    return sendSuccess(
      res,
      "Events retrieved successfully",
      eventList
    );
  } catch (error) {
    console.error("Get events error:", error);

    return sendError(res, "Failed to retrieve events");
  }
};
