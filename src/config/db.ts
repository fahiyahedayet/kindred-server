
import { setServers } from "node:dns";
import { MongoClient, Db } from "mongodb";

setServers(["8.8.8.8", "8.8.4.4"]);

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

export const client = new MongoClient(uri);

let database: Db;

export const connectDB = async (): Promise<Db> => {
  if (database) {
    return database;
  }

  await client.connect();

  database = client.db("kindred");

  console.log("MongoDB connected successfully");

  return database;
};
