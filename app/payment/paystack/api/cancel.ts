import express, { Request, Response } from "express";
export const cancel: express.RequestHandler = async (
  _: Request,
  res: Response
) => {
  res.status(200).json({ success: "true" });
};
