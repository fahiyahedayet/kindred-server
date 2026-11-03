
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { client } from "./db.js";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
const clientURL = process.env.CLIENT_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
}

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is missing");
}

export const auth = betterAuth({
  database: mongodbAdapter(client.db("kindred"), {
    client,
  }),

  secret,
  baseURL,

  trustedOrigins: [
    clientURL || "http://localhost:3000",
  ],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  user: {
    additionalFields: {
      location: {
        type: "string",
        required: false,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  plugins: [jwt()],
});
