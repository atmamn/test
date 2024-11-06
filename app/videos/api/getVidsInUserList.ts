import express, { Request, Response, NextFunction } from "express";
import { decodeUserEmail } from "../../auth/email/api/getUserEmail";
import { AppError } from "../../../lib/error";
import { dynamoDB } from "../../../db/dal";
import { GetCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { bucketUrl } from "../../../utils/constants/s3url";

export const getUserListVids: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = decodeUserEmail(req, null, next);

    // Fetch user list from "Users" table
    const getParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email",
      },
      ProjectionExpression: "user_list",
    };

    const { Item } = await dynamoDB.send(new GetCommand(getParams));

    if (!Item || !Item.user_list || Item.user_list.length === 0) {
      return next(
        new AppError(
          "No videos found",
          404,
          "No videos found in the user list",
          true
        )
      );
    }

    // Prepare keys for BatchGetCommand
    const videoKeys = Item.user_list.map(
      (video: { category: string; videoId: string }) => ({
        videoId: video.videoId,
        category: video.category,
      })
    );

    const batchGetParams = {
      RequestItems: {
        Videos: {
          Keys: videoKeys,
          ProjectionExpression: "videoId, category, posterImageS3Key", // Limit the fields returned
        },
      },
    };

    // Batch query the Videos table
    const batchGetResult = await dynamoDB.send(
      new BatchGetCommand(batchGetParams)
    );

    if (
      !batchGetResult.Responses ||
      batchGetResult.Responses.Videos.length === 0
    ) {
      return next(
        new AppError(
          "Client error",
          404,
          "Failed to get videos from the user list",
          true
        )
      );
    }

    const updatedBatchGetResult = batchGetResult.Responses.Videos.map(
      (item) => ({
        ...item,
        posterUrl: `${bucketUrl}${item.posterImageS3Key}`,
      })
    );
    // Send the response with video details
    res.status(200).send({ status: "success", data: updatedBatchGetResult });
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
