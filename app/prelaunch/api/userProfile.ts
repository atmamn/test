import express, { Request, Response, NextFunction } from "express";
import { decodeUserEmail } from "../../auth/email/api/getUserEmail";
import { dynamoDB } from "../../../db/dal";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { AppError } from "../../../lib/error";
export const userProfile: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = decodeUserEmail(req, null, next);

    // query params
    const queryParams = {
      TableName: "Users",
      KeyConditionExpression: "email = :email AND acc_type = :acc_type",
      ExpressionAttributeValues: {
        ":email": email,
        ":acc_type": "email",
      },
    };

    const data = await dynamoDB.send(new QueryCommand(queryParams));
    console.log(data);

    if (!data.Items || data.Items.length === 0) {
      return next(new AppError("Not Found", 404, "No user found", true));
    }

    // Filter out the 'password' field from the result (if it exists)

    const filteredData = data.Items.map((item) => {
      const { password, ...filteredItem } = item; // Destructure to remove password
      return filteredItem; // Return the rest of the fields without password
    });

    return res.status(200).json({ status: "success", data: filteredData });
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
