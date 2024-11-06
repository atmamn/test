import express, { NextFunction, Request, Response } from "express";
import { AppError } from "../../../lib/error";
import { hasUserRatedVid } from "../../../utils/app/hasUserRatedVid";

interface BodyProps {
  videoId: string;
  category: string;
}
export const isVideoRatedByUser: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { videoId, category }: BodyProps = req.body;

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
  try {
    const userHasRatedVid = await hasUserRatedVid(req, next);

    res.status(200).json({
      status: "success",
      message: userHasRatedVid ? true : false,
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
