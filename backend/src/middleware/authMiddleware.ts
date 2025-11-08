import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include userId
export interface AuthRequest extends Request {
  userId?: number;
}

interface JwtPayload {
  userId: number;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token and attaches userId to request object
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      res.status(401).json({
        error: "Access token required",
        message: "Please provide a valid authentication token",
      });
      return;
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "your-secret-key";

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          res.status(403).json({
            error: "Token expired",
            message: "Your session has expired. Please login again",
          });
          return;
        }

        res.status(403).json({
          error: "Invalid token",
          message: "The provided token is invalid",
        });
        return;
      }

      // Attach userId to request object
      const payload = decoded as JwtPayload;
      req.userId = payload.userId;

      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during authentication",
    });
  }
};

/**
 * Optional middleware to check if user is authenticated
 * but doesn't fail if not authenticated (for optional auth routes)
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const secret = process.env.JWT_SECRET || "your-secret-key";

      jwt.verify(token, secret, (err, decoded) => {
        if (!err) {
          const payload = decoded as JwtPayload;
          req.userId = payload.userId;
        }
      });
    }

    next();
  } catch (error) {
    next();
  }
};

export default authenticateToken;
