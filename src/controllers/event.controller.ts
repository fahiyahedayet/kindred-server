import { MongoServerError, ObjectId } from "mongodb";
import type { Request, Response } from "express";
import { getCollections } from "../config/collections.js";
import type { Event, EventCategory, EventJoin } from "../types/event.js";
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
    const upcoming = req.query.upcoming?.toString() === "true";

    const requestedLimit = Number(req.query.limit);
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : undefined;

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

    if (upcoming) {
      filter.eventDate = { $gt: new Date() };
    }

    let query = events.find(filter).sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(limit);
    }

    const eventList = await query.toArray();

    return sendSuccess(res, "Events retrieved successfully", eventList);
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

export const joinEvent = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;
    const eventIdParam = req.params.id;

    if (typeof eventIdParam !== "string") {
      return sendError(res, "Invalid event ID.", 400);
    }

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    if (!/^[0-9a-fA-F]{24}$/.test(eventIdParam)) {
      return sendError(res, "Invalid event ID.", 400);
    }

    const eventId = new ObjectId(eventIdParam);
    const { events, eventJoins } = await getCollections();

    const event = await events.findOne({ _id: eventId });

    if (!event) {
      return sendError(res, "Event not found.", 404);
    }

    if (event.eventDate <= new Date()) {
      return sendError(res, "You cannot join a past event.", 400);
    }

    const eventJoin: EventJoin = {
      eventId,
      userId: user.id,
      userEmail: user.email || "",
      joinedAt: new Date(),
    };

    await eventJoins.insertOne(eventJoin);

    await events.updateOne(
      { _id: eventId },
      {
        $inc: { volunteerCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );

    return sendSuccess(
      res,
      "You have successfully joined this event!",
      {
        eventId: eventId.toString(),
        volunteerCount: event.volunteerCount + 1,
      },
      201
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return sendError(res, "You have already joined this event.", 409);
    }

    console.error("Join event error:", error);
    return sendError(res, "Failed to join this event.", 500);
  }
};


export const getJoinStatus = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;
    const eventIdParam = req.params.id;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    if (typeof eventIdParam !== "string" || !/^[0-9a-fA-F]{24}$/.test(eventIdParam)) {
      return sendError(res, "Invalid event ID.", 400);
    }

    const eventId = new ObjectId(eventIdParam);
    const { events, eventJoins } = await getCollections();

    const event = await events.findOne({ _id: eventId });

    if (!event) {
      return sendError(res, "Event not found.", 404);
    }

    const existingJoin = await eventJoins.findOne({
      eventId,
      userId: user.id,
    });

    return sendSuccess(res, "Join status retrieved successfully.", {
      hasJoined: Boolean(existingJoin),
    });
  } catch (error) {
    console.error("Get join status error:", error);
    return sendError(res, "Failed to retrieve join status.", 500);
  }
};

export const getJoinedEvents = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    const { events, eventJoins } = await getCollections();

    const joins = await eventJoins
      .find({ userId: user.id })
      .sort({ joinedAt: -1 })
      .toArray();

    if (joins.length === 0) {
      return sendSuccess(res, "Joined events retrieved successfully.", []);
    }

    const eventIds = joins.map((join) => join.eventId);

    const joinedEvents = await events
      .find({ _id: { $in: eventIds } })
      .toArray();

    const eventMap = new Map(
      joinedEvents.map((event) => [event._id!.toString(), event])
    );

    const result = joins
      .map((join) => {
        const event = eventMap.get(join.eventId.toString());

        if (!event) {
          return null;
        }

        return {
          ...event,
          joinedAt: join.joinedAt,
        };
      })
      .filter((event) => event !== null);

    return sendSuccess(
      res,
      "Joined events retrieved successfully.",
      result
    );
  } catch (error) {
    console.error("Get joined events error:", error);
    return sendError(res, "Failed to retrieve joined events.", 500);
  }
};

export const leaveEvent = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;
    const eventIdParam = req.params.id;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    if (
      typeof eventIdParam !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(eventIdParam)
    ) {
      return sendError(res, "Invalid event ID.", 400);
    }

    const eventId = new ObjectId(eventIdParam);
    const { events, eventJoins } = await getCollections();

    const event = await events.findOne({ _id: eventId });

    if (!event) {
      return sendError(res, "Event not found.", 404);
    }

    if (new Date(event.eventDate) <= new Date()) {
      return sendError(res, "You cannot leave a completed event.", 400);
    }

    const leaveResult = await eventJoins.deleteOne({
      eventId,
      userId: user.id,
    });

    if (leaveResult.deletedCount === 0) {
      return sendError(res, "You have not joined this event.", 404);
    }

    await events.updateOne(
      { _id: eventId, volunteerCount: { $gt: 0 } },
      {
        $inc: { volunteerCount: -1 },
        $set: { updatedAt: new Date() },
      }
    );

    return sendSuccess(res, "You have successfully left this event.", {
      eventId: eventId.toString(),
      volunteerCount: Math.max(0, event.volunteerCount - 1),
    });
  } catch (error) {
    console.error("Leave event error:", error);
    return sendError(res, "Failed to leave this event.", 500);
  }
};

export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    const { events } = await getCollections();

    const myEvents = await events
      .find({ creatorId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(
      res,
      "Your events fetched successfully.",
      myEvents
    );
  } catch (error) {
    console.error("Get my events error:", error);
    return sendError(res, "Failed to fetch your events.", 500);
  }
};
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;
    const eventIdParam = req.params.id;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    if (
      typeof eventIdParam !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(eventIdParam)
    ) {
      return sendError(res, "Invalid event ID.", 400);
    }

    const eventId = new ObjectId(eventIdParam);
    const { events, eventJoins } = await getCollections();

    const event = await events.findOne({
      _id: eventId,
      creatorId: user.id,
    });

    if (!event) {
      return sendError(
        res,
        "Event not found or you are not allowed to delete it.",
        404
      );
    }

    const deleteResult = await events.deleteOne({
      _id: eventId,
      creatorId: user.id,
    });

    if (deleteResult.deletedCount === 0) {
      return sendError(res, "Event could not be deleted.", 404);
    }

    await eventJoins.deleteMany({ eventId });

    return sendSuccess(res, "Event deleted successfully.", {
      eventId: eventId.toString(),
    });
  } catch (error) {
    console.error("Delete event error:", error);
    return sendError(res, "Failed to delete event.", 500);
  }
};
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as AuthenticatedUser | undefined;
    const eventIdParam = req.params.id;

    if (!user?.id) {
      return sendError(res, "Authentication required.", 401);
    }

    if (
      typeof eventIdParam !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(eventIdParam)
    ) {
      return sendError(res, "Invalid event ID.", 400);
    }

    const {
      title,
      description,
      category,
      imageUrl,
      location,
      eventDate,
      tags,
    } = req.body;

    const validCategories = [
      "Cleanup",
      "Plantation",
      "Donation",
      "Community",
      "Education",
      "Animal Welfare",
      "Healthcare",
      "Other",
    ];

    if (
      typeof title !== "string" ||
      title.trim().length < 5 ||
      title.trim().length > 80
    ) {
      return sendError(res, "Title must be between 5 and 80 characters.", 400);
    }

    if (
      typeof description !== "string" ||
      description.trim().length < 30 ||
      description.trim().length > 1500
    ) {
      return sendError(
        res,
        "Description must be between 30 and 1500 characters.",
        400
      );
    }

    if (!validCategories.includes(category)) {
      return sendError(res, "Please select a valid category.", 400);
    }

    if (typeof location !== "string" || !location.trim()) {
      return sendError(res, "Location is required.", 400);
    }

    const parsedDate = new Date(eventDate);

    if (
      !eventDate ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate <= new Date()
    ) {
      return sendError(res, "Please select a future event date.", 400);
    }

    if (imageUrl && typeof imageUrl !== "string") {
      return sendError(res, "Invalid image URL.", 400);
    }

    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return sendError(res, "Image URL must use HTTP or HTTPS.", 400);
        }
      } catch {
        return sendError(res, "Please provide a valid image URL.", 400);
      }
    }

    if (
      !Array.isArray(tags) ||
      tags.length > 5 ||
      !tags.every(
        (tag: unknown) =>
          typeof tag === "string" &&
          tag.trim().length > 0 &&
          tag.trim().length <= 25
      )
    ) {
      return sendError(res, "Please provide up to 5 valid tags.", 400);
    }

    const eventId = new ObjectId(eventIdParam);
    const { events } = await getCollections();

    const result = await events.updateOne(
      {
        _id: eventId,
        creatorId: user.id,
      },
      {
        $set: {
          title: title.trim(),
          description: description.trim(),
          category,
          imageUrl: imageUrl?.trim() || "",
          location: location.trim(),
          eventDate: parsedDate,
          tags: tags.map((tag: string) => tag.trim()),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return sendError(
        res,
        "Event not found or you are not allowed to update it.",
        404
      );
    }

    const updatedEvent = await events.findOne({
      _id: eventId,
      creatorId: user.id,
    });

    return sendSuccess(res, "Event updated successfully.", updatedEvent);
  } catch (error) {
    console.error("Update event error:", error);
    return sendError(res, "Failed to update event.", 500);
  }
};