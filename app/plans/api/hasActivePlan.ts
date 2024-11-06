import express, { Request, Response, NextFunction } from "express";
import { decodeUserEmail } from "../../auth/email/api/getUserEmail";
import { AppError } from "../../../lib/error";
import { CURRENTDATE } from "../../../lib/constants/dates";
import { dynamoDB } from "../../../db/dal";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
export const hasActivePlan: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = decodeUserEmail(req, null, next);
    console.log("email", email);
    const queryParams = {
      TableName: "Users",
      KeyConditionExpression: "email = :email AND acc_type = :acc_type",
      ExpressionAttributeValues: {
        ":email": email,
        ":acc_type": "email",
      },
    };

    const data = await dynamoDB.send(new QueryCommand(queryParams));

    // Check if any items were returned
    if (!data.Items || data.Items.length === 0) {
      return next(new AppError("Not Found", 404, "No user found", true));
    }

    const expiresIn = data.Items[0].expiresIn;
    console.log("expiresIn", expiresIn);

    if (!expiresIn) {
      return next(new AppError("Not Found", 404, "User plan not found", true));
    }

    if (CURRENTDATE > expiresIn) {
      return next(new AppError("Expired", 403, "User plan has expired", true));
    }

    res
      .status(200)
      .json({ status: "success", message: "User has active plan" });
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
