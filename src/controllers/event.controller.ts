
import type { Request, Response } from "express";
import { getCollections } from "../config/collections.js";
import type { Event, EventCategory } from "../types/event.js";
import type { AuthenticatedUser } from "../middleware/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const allowedCategories: EventCategory[] = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Community",
  "Education",
  "Animal Welfare",
  "Healthcare",
  "Other",
];

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { events } = await getCollections();

    const search = req.query.search?.toString().trim() || "";
    const category = req.query.category?.toString().trim() || "";

    const filter: Record<string, unknown> = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { location: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      filter.category = category;
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
    return sendError(res, "Failed to retrieve events.", 500);
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      imageUrl,
      location,
      eventDate,
      tags,
    } = req.body;

    const user = res.locals.user as AuthenticatedUser | undefined;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      typeof location !== "string" ||
      !location.trim() ||
      !eventDate
    ) {
      return sendError(
        res,
        "Please provide all required event information.",
        400
      );
    }

    if (title.trim().length < 5 || title.trim().length > 80) {
      return sendError(
        res,
        "Event title must be between 5 and 80 characters.",
        400
      );
    }

    if (description.trim().length < 30 || description.trim().length > 1500) {
      return sendError(
        res,
        "Event description must be between 30 and 1500 characters.",
        400
      );
    }

    if (!allowedCategories.includes(category as EventCategory)) {
      return sendError(res, "Please select a valid event category.", 400);
    }

    if (imageUrl !== undefined && typeof imageUrl !== "string") {
      return sendError(res, "Image URL must be text.", 400);
    }

    if (imageUrl?.trim()) {
      try {
        const parsedImageUrl = new URL(imageUrl);

        if (!["http:", "https:"].includes(parsedImageUrl.protocol)) {
          return sendError(
            res,
            "Image URL must use HTTP or HTTPS.",
            400
          );
        }
      } catch {
        return sendError(res, "Please provide a valid image URL.", 400);
      }
    }

    const parsedDate = new Date(eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(res, "Please provide a valid event date.", 400);
    }

    if (parsedDate <= new Date()) {
      return sendError(
        res,
        "Event date must be in the future.",
        400
      );
    }

    if (
      !Array.isArray(tags) ||
      !tags.every(
        (tag: unknown) => typeof tag === "string" && tag.trim().length > 0
      )
    ) {
      return sendError(res, "Tags must be a list of valid text values.", 400);
    }

    if (tags.length > 5 || tags.some((tag: string) => tag.trim().length > 25)) {
      return sendError(
        res,
        "You can add up to 5 tags, with a maximum of 25 characters each.",
        400
      );
    }

    const event: Event = {
      title: title.trim(),
      description: description.trim(),
      category: category as EventCategory,
      imageUrl: imageUrl?.trim() || "",
      location: location.trim(),
      eventDate: parsedDate,
      tags: tags.map((tag: string) => tag.trim()),
      creatorId: user.id,
      creatorEmail: user.email || "",
      volunteerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { events } = await getCollections();
    const result = await events.insertOne(event);

    return sendSuccess(
      res,
      "Event created successfully.",
      {
        ...event,
        _id: result.insertedId,
      },
      201
    );
  } catch (error) {
    console.error("Create event error:", error);
    return sendError(res, "Failed to create event.", 500);
  }
};
