import express, { NextFunction, Request, Response } from "express";
import { AppError } from "../../../../lib/error";
import { dynamoDB } from "../../../../db/dal";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { decodeUserEmail } from "./getUserEmail";

export const logout: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(
      new AppError(
        "Invalid credentials",
        401,
        "No token or email provided",
        true
      )
    );
  }

  const email = decodeUserEmail(req, null, next);

  // insert the token inside the invalid tokens table
  const putParams = {
    TableName: "InvalidTokens",
    Item: {
      email: email,
      token: token,
    },
  };

  try {
    await dynamoDB.send(new PutCommand(putParams));

    res.status(200).json({ status: "success", message: "Logged out" });
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
