import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../lib/error";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AppError("Unauthorized", 401, "No token provided", true));
  }

  // Optionally, you can add further token verification logic here if needed

  // Proceed to the next middleware/route handler if token is present
  next();
};
