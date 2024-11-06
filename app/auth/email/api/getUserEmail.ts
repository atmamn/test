import express, { Request, Response, NextFunction } from "express";
import { AppError } from "../../../../lib/error";
import jwt from "jsonwebtoken";

export const decodeUserEmail = (
  req: Request,
  _: any,
  next: NextFunction
): string => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new AppError("Unauthorized", 401, "No token provided", true);
  }

  try {
    // Decode the token to get the email
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const { email } = decoded as { email: string };
    return email;
  } catch (error) {
    // Throw the error so it can be caught by the calling function
    next(
      new AppError(
        "Internal server error",
        500,
        (error as Error).message + " Please try again later",
        true
      )
    );
    throw error; // Add this line to stop the function and indicate an error occurred
  }
};

export const getUserEmail: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = decodeUserEmail(req, null, next);

    if (!email) {
      return next(new AppError("Unauthorized", 401, "No token provided", true));
    }

    // any req to this endpoint is from accType email
    return res.status(200).json({ email, accType: "email" });
  } catch (error) {
    return next(
      new AppError(
        "Internal server error",
        500,
        (error as Error).message + " Please try again later",
        true
      )
    );
  }
};
