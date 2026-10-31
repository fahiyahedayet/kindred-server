
import { Collection } from "mongodb";
import { connectDB } from "./db.js";
import { Event, EventJoin } from "../types/event.js";

export interface KindredCollections {
  events: Collection<Event>;
  eventJoins: Collection<EventJoin>;
}

export const getCollections = async (): Promise<KindredCollections> => {
  const db = await connectDB();

  return {
    events: db.collection<Event>("events"),
    eventJoins: db.collection<EventJoin>("event_joins"),
  };
};

export const createIndexes = async (): Promise<void> => {
  const db = await connectDB();

  await Promise.all([
    db.collection<Event>("events").createIndex({ eventDate: 1 }),
    db.collection<Event>("events").createIndex({
      category: 1,
      eventDate: 1,
    }),
    db.collection<Event>("events").createIndex({
      creatorId: 1,
      createdAt: -1,
    }),
    db.collection<EventJoin>("event_joins").createIndex(
      { eventId: 1, userId: 1 },
      { unique: true }
    ),
    db.collection<EventJoin>("event_joins").createIndex({
      userId: 1,
      joinedAt: -1,
    }),
  ]);

  console.log("MongoDB indexes created successfully");
};
