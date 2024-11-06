import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextFunction, Request } from "express";
import { decodeUserEmail } from "../../app/auth/email/api/getUserEmail";
import { dynamoDB } from "../../db/dal";
import { AppError } from "../../lib/error";

// Utility function to check if video exists in the user's list
export const hasUserRatedVid = async (
  req: Request,
  next: NextFunction
): Promise<boolean> => {
  try {
    const email = decodeUserEmail(req, null, next); // Use existing function to get email

    const getParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email",
      },
      ProjectionExpression: "user_video_rating", // Only fetch user_list
    };

    const userData = await dynamoDB.send(new GetCommand(getParams));

    const userVidRatingList = userData.Item?.user_video_rating || [];

    const videoRatingExists = userVidRatingList.some(
      (item: { videoId: string; category: string }) =>
        item.videoId === req.body.videoId && item.category === req.body.category
    );

    return videoRatingExists;
  } catch (error) {
    next(
      new AppError(
        "Internal server error",
        500,
        (error as Error).message + " Please try again later",
        true
      )
    );
    throw error;
  }
};
