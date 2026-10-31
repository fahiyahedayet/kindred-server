
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
