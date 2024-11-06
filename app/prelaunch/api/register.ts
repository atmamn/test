import express, { Request, Response, NextFunction } from "express";
import { AppError } from "../../../lib/error";
import {
  generateSalt,
  hashPassword,
} from "../../../utils/middleware/bcrypt/bcryptUtils";
import { dynamoDB } from "../../../db/dal";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { jwtGenerateToken } from "../../../utils/middleware/jwt/jwt";

interface BodyProps {
  email: string;
  password: string;
  username: string;
}

export const registerUser: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password, username }: BodyProps = req.body;

  if (!email || !password || !username) {
    return next(
      new AppError("Invalid input", 400, "Missing required fields", true)
    );
  }

  // check if the user already exists in the DB
  const queryParams = {
    TableName: "Users",
    KeyConditionExpression: "email = :email AND acc_type = :acc_type",
    ExpressionAttributeValues: {
      ":email": email,
      ":acc_type": "email",
    },
  };

  try {
    const result = await dynamoDB.send(new QueryCommand(queryParams));
    if (result.Items && result.Items.length > 0) {
      return next(
        new AppError("Client error", 400, "User already exists", true)
      );
    }

    // encrypt the password
    const saltRounds = 10;
    const salt = await generateSalt(saltRounds);
    const hash = await hashPassword(password, salt);

    const putParams = {
      TableName: "Users",
      Item: {
        email: email,
        acc_type: "email",
        username,
        password: hash,
      },
    };

    // put params for the Users table
    const result1 = await dynamoDB.send(new PutCommand(putParams));
    if (!result1) {
      return next(
        new AppError(
          "Internal server error",
          500,
          "Failed to create user",
          true
        )
      );
    }

    // generate jwt token for the email
    const token = jwtGenerateToken(email);

    return res.status(200).json({
      status: "success",
      message: "User created successfully",
      token,
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
