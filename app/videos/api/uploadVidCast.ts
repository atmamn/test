import express, { Request, Response, NextFunction } from "express";
import { upload } from "../../../lib/multer/upload";
import { AppError } from "../../../lib/error";
import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { dynamoDB, s3 } from "../../../db/dal";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";

interface BodyProps {
  videoId: string;
  category: string;
  castName: string;
}

// TODO: add check to stop upload of img greater than 100kb

export const uploadVidCast: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("img")(req, res, async (error) => {
    const { videoId, category, castName }: BodyProps = req.body;

    if (error) {
      return next(
        new AppError("Client error", 400, "Internal server error", true)
      );
    }

    if (!req.file || !castName || !videoId || !category) {
      return next(
        new AppError("Client error", 400, "Missing required fields", true)
      );
    }

    try {
      // Upload image to S3
      const s3Key = `${Date.now()}_${req.file.originalname}`;
      const s3Params = {
        Bucket: process.env.AWS_BUCKET!,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(s3Params));

      // Update DynamoDB video_cast attribute
      const updateParams = {
        TableName: "Videos",
        Key: { videoId, category },
        UpdateExpression:
          "SET video_cast = list_append(if_not_exists(video_cast, :empty_list), :new_cast)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":new_cast": [
            {
              castName,
              imageS3Key: s3Key,
            },
          ],
        },
        ReturnValues: ReturnValue.UPDATED_NEW,
      };

      await dynamoDB.send(new UpdateCommand(updateParams));

      res.status(200).json({
        status: "success",
        message: "Cast and image uploaded successfully",
      });
    } catch (err) {
      return next(
        new AppError(
          "Internal server error",
          500,
          (err as Error).message + " Please try again later",
          true
        )
      );
    }
  });
};
