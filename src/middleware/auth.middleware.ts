
import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { sendError } from "../utils/apiResponse.js";

const authURL = process.env.BETTER_AUTH_URL;

if (!authURL) {
  throw new Error("BETTER_AUTH_URL is missing");
}

const JWKS = createRemoteJWKSet(
  new URL(`${authURL}/api/auth/jwks`)
);

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return sendError(res, "Authentication required", 401);
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return sendError(res, "Authentication token is missing", 401);
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: authURL,
      audience: authURL,
    });

    if (typeof payload.sub !== "string") {
      return sendError(res, "Invalid authentication token", 401);
    }

    res.locals.user = {
      id: payload.sub,
      email:
        typeof payload.email === "string"
          ? payload.email
          : undefined,
    } satisfies AuthenticatedUser;

    next();
  } catch {
    return sendError(res, "Invalid or expired authentication token", 401);
  }
};
