import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { decode } from "node:punycode";

interface JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// const JWT_SECRET = process.env.JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET ?? "rahasia_super_aman";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (typeof decoded.id !== "string" || typeof decoded.role !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}
