import express, { Request, Response, NextFunction } from "express";
import { AppError } from "../../../lib/error";
import { dynamoDB } from "../../../db/dal";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { bucketUrl } from "../../../utils/constants/s3url";

// interface BodyProps {
//     videoId: string;
//     category: string;
// }
export const getVidUrl: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { videoId, category } = req.query;
  if (!videoId || !category) {
    return next(
      new AppError(
        "Client error",
        400,
        "Missing required videoId or category",
        true
      )
    );
  }
  const queryParams = {
    TableName: "Videos",
    KeyConditionExpression: "videoId = :videoId AND category = :category",
    ExpressionAttributeValues: {
      ":videoId": videoId,
      ":category": category,
    },
    ProjectionExpression: "videoS3Key",
  };

  try {
    const data = await dynamoDB.send(new QueryCommand(queryParams));

    if (!data.Items || data.Items.length === 0) {
      return next(new AppError("Not Found", 404, "No video found", true));
    }

    const { videoS3Key } = data.Items[0];
    res
      .status(200)
      .json({ status: "success", videoUrl: `${bucketUrl}${videoS3Key}` });
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
