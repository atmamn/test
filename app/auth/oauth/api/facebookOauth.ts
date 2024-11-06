import express, { Request, Response, NextFunction } from "express";
import { AppError } from "../../../../lib/error";
import { dynamoDB } from "../../../../db/dal";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const FACEBOOK_GRAPH_API_URL = "https://graph.facebook.com/me";

// Verify the token route
export const facebookOauth: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accessToken }: { accessToken: string } = req.body;
  console.log("accessToken", accessToken);

  if (!accessToken) {
    return next(
      new AppError(
        "Client error",
        400,
        "Missing required category or videoId",
        true
      )
    );
  }

  try {
    // Verify the token with Facebook
    const response = await fetch(
      `${FACEBOOK_GRAPH_API_URL}?access_token=${accessToken}&fields=id,name,email,picture`
    );
    const profile = await response.json();
    console.log("profile", profile);

    if (profile.error) {
      return next(
        new AppError(
          "Invalid request",
          403,
          "Invalid Facebook access token",
          true
        )
      );
    }

    // get the user email
    const email = profile.email;
    console.log("email", email);

    // Check if the user exists in your database

    // query params
    const queryParams = {
      TableName: "Users",
      KeyConditionExpression: "email = :email AND acc_type = :acc_type",
      ExpressionAttributeValues: {
        ":email": email,
        ":acc_type": "oauth",
      },
    };

    // send the query
    const data = await dynamoDB.send(new QueryCommand(queryParams));

    if (data.Items && data.Items.length > 0) {
      // create token
      // User exists in your database
      return res.status(200).json({
        message: "Login successful",
        profile,
      });
    } else {
      // User does not exist in your database
      // Create a new user

      // put params
      const putParams = {
        TableName: "Users",
        Item: {
          email,
          acc_type: "oauth",
        },
      };

      // send the put
      const result = await dynamoDB.send(new PutCommand(putParams));

      if (!result) {
        return next(
          new AppError(
            "Internal server error",
            500,
            "Failed to create user",
            true
          )
        );
      }

      res.status(200).json({
        message: "Login successful",
        profile,
      });
    }
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
