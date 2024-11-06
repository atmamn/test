import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import express, { NextFunction, Request, Response } from "express";
import { dynamoDB, s3 } from "../../../db/dal";
import { AppError } from "../../../lib/error";
import { upload } from "../../../lib/multer/upload";

interface MulterRequest extends Request {
  files: {
    [fieldname: string]: Express.Multer.File[];
  };
}

interface BodyProps {
  category: string;
  title: string;
  description: string;
}

// TODO: replace spaces in the file name with '-'

export const uploadVideo: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "poster", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ])(req, res, async (error) => {
    try {
      const multerReq = req as MulterRequest;

      const videoFile = multerReq.files?.video?.[0];
      const posterFile = multerReq.files?.poster?.[0];
      const trailerFile = multerReq.files?.trailer?.[0];
      const { category, title, description }: BodyProps = req.body;

      if (!videoFile || !posterFile || !title || !description) {
        return next(
          new AppError("Client error", 400, "Missing required fields", true)
        );
      }

      const videoId = Date.now() + Math.floor(Math.random() * 1000);
      const videoKey = `${videoId}-${videoFile.originalname}`;
      const posterKey = `${videoId}-poster-${posterFile.originalname}`;
      const trailerKey = trailerFile
        ? `${videoId}-trailer-${trailerFile.originalname}`
        : null;

      // Upload video, poster, and trailer to S3
      const uploadPromises = [
        s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET as string,
            Key: videoKey,
            Body: videoFile.buffer,
            ContentType: videoFile.mimetype,
          })
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET as string,
            Key: posterKey,
            Body: posterFile.buffer,
            ContentType: posterFile.mimetype,
          })
        ),
      ];

      if (trailerFile) {
        uploadPromises.push(
          s3.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET as string,
              Key: trailerKey as string,
              Body: trailerFile.buffer,
              ContentType: trailerFile.mimetype,
            })
          )
        );
      }

      await Promise.all(uploadPromises);

      // Store metadata in DynamoDB

      const dynamoDBParams = {
        TableName: "Videos",
        Item: {
          videoId: videoId.toString(),
          videoS3Key: videoKey,
          category: category || "uncategorized",
          title,
          description,
          posterImageS3Key: posterKey,
          ...(trailerKey && { trailerS3Key: trailerKey }),
        },
      };

      await dynamoDB.send(new PutCommand(dynamoDBParams));

      res.status(200).json({
        status: "success",
        message: "Video and associated files uploaded successfully",
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
  });
};
