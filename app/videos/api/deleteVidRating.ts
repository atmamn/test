import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../lib/error";
import { decodeUserEmail } from "../../auth/email/api/getUserEmail";
import { dynamoDB } from "../../../db/dal";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ReturnValue } from "@aws-sdk/client-dynamodb";

interface BodyProps {
  videoId: string;
  category: string;
}

export const deleteVidRating = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { videoId, category }: BodyProps = req.body;

  if (!videoId || !category) {
    return next(
      new AppError("Client error", 400, "Missing required fields", true)
    );
  }

  try {
    // Get the user's email after validation in the utility
    const email = decodeUserEmail(req, null, next);

    // Fetch the user's existing ratings
    const getParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email",
      },
      ProjectionExpression: "user_video_rating",
    };

    const { Item } = await dynamoDB.send(new GetCommand(getParams));
    const existingRatings = Item?.user_video_rating || [];

    // Find the index of the rating with the matching videoId and category
    const ratingIndex = existingRatings.findIndex(
      (item: { videoId: string; category: string }) =>
        item.videoId === videoId && item.category === category
    );

    // If the rating doesn't exist, return an error
    if (ratingIndex === -1) {
      return next(new AppError("Client error", 404, "Rating not found", true));
    }

    // Remove the rating from the list
    existingRatings.splice(ratingIndex, 1);

    // Update the DynamoDB item with the modified ratings list
    const updateParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email",
      },
      UpdateExpression: "SET user_video_rating = :updated_list",
      ExpressionAttributeValues: {
        ":updated_list": existingRatings,
      },
      ReturnValues: ReturnValue.UPDATED_NEW,
    };

    await dynamoDB.send(new UpdateCommand(updateParams));

    res.status(200).json({
      status: "success",
      message: "Video rating deleted",
    });
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
