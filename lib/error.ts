import { Request, Response, NextFunction } from "express";

// Your AppError and errorHandler implementation
export class AppError extends Error {
  // Implementation...
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Implementation...
};
