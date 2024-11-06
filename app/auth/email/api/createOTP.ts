import { PutCommand } from "@aws-sdk/lib-dynamodb";
import express, { NextFunction, Request, Response } from "express";
import { dynamoDB } from "../../../../db/dal";
import { AppError } from "../../../../lib/error";
import nodemailerFn from "../../../../lib/nodemailer/nodemailer";
import {
  generateSalt,
  hashPassword,
} from "../../../../utils/middleware/bcrypt/bcryptUtils";
import { PLUSTHIRTYMINUTES } from "../../../../lib/constants/dates";

interface BodyProps {
  username: string;
  email: string;
  password: string;
}
export const createOTP: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, email, password }: BodyProps = req.body;

  if (!username || !email || !password) {
    return next(
      new AppError("Invalid input", 400, "Missing required fields", true)
    );
  }

  // generate 6 random numbers that will be sent to the email address of the assumed user
  const randomNumbers = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  // Send the random numbers to the user's email address
  const message = `<div><h2>${randomNumbers}</h2></div>`; // move to the messages folder and add inline css
  const subject = "OTP";
  const text = `${randomNumbers}`;

  try {
    // send the OTP via email
    nodemailerFn(message, email, subject, text);
    // handle error for email send failure

    const saltRounds = 10;
    const salt = await generateSalt(saltRounds);
    const hash = await hashPassword(password, salt);

    // save the OTP in the db

    const putParams = {
      TableName: "OTPs",
      Item: {
        username,
        password: hash,
        email: email,
        code: randomNumbers,
        timestamp: PLUSTHIRTYMINUTES,
        verified: false,
      },
    };

    await dynamoDB.send(new PutCommand(putParams));

    res.status(200).json({ status: "success", message: "OTP sent" });
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
