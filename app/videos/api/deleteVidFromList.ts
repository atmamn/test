import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import express, { NextFunction, Request, Response } from "express";
import { dynamoDB } from "../../../db/dal";
import { AppError } from "../../../lib/error";
import { decodeUserEmail } from "../../auth/email/api/getUserEmail";

interface BodyProps {
  videoId: string;
}

export const deleteVidFromList: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { videoId }: BodyProps = req.body;

  if (!videoId) {
    return next(new AppError("Client error", 400, "Missing videoId", true));
  }

  try {
    // Get the user's email
    const email = decodeUserEmail(req, null, next);

    // Step 1: Fetch the user's list
    const getParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email",
      },
      ProjectionExpression: "user_list",
    };

    const { Item } = await dynamoDB.send(new GetCommand(getParams));

    if (!Item || !Item.user_list) {
      return next(new AppError("Not Found", 404, "No user list found", true));
    }

    const userList = Item.user_list;
    const videoIndex = userList.findIndex(
      (vid: { videoId: string }) => vid.videoId === videoId
    );

    if (videoIndex === -1) {
      return next(
        new AppError(
          "Not Found",
          404,
          "Video does not exist in your list",
          true
        )
      );
    }

    // Step 2: Remove the video from the list by index
    const updateParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email",
      },
      UpdateExpression: `REMOVE user_list[${videoIndex}]`,
      ReturnValues: ReturnValue.ALL_NEW,
    };

    await dynamoDB.send(new UpdateCommand(updateParams));

    res.status(200).json({
      status: "success",
      message: "Video removed from your list",
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
