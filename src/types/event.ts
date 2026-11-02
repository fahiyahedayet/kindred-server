
import { ObjectId } from "mongodb";

export type EventCategory =
  | "Cleanup"
  | "Plantation"
  | "Donation"
  | "Community"
  | "Education"
  | "Animal Welfare"
  | "Healthcare"
  | "Other";

export interface Event {
  _id?: ObjectId;
  title: string;
  description: string;
  category: EventCategory;
  imageUrl: string;
  location: string;
  eventDate: Date;
  tags: string[];
  creatorId: string;
  creatorEmail: string;
  volunteerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventJoin {
  _id?: ObjectId;
  eventId: ObjectId;
  userId: string;
  userEmail: string;
  joinedAt: Date;
}
