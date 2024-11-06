import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import express, { NextFunction, Request, Response } from "express";
import { dynamoDB } from "../../../../db/dal";
import { MINUSTHIRTYMINUTES } from "../../../../lib/constants/dates";
import { AppError } from "../../../../lib/error";
import {
  generateSalt,
  hashPassword,
} from "../../../../utils/middleware/bcrypt/bcryptUtils";
import { jwtGenerateToken } from "../../../../utils/middleware/jwt/jwt";
import { setToken } from "../../../../utils/middleware/jwt/setToken";

interface BodyProps {
  code: string;
  email: string;
  password: string;
  username: string;
}

export const verifyOTP: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code, email, password, username }: BodyProps = req.body;

  if (!code || !email || !password || !username) {
    return next(new AppError("Unauthorized", 401, "Invalid input", true));
  }

  // compare the timestamp in the DB with the current timestamp, if the difference between them is greater than 30 minutes, then the OTP is invalid
  const thirtyMinutesAgo = MINUSTHIRTYMINUTES; // Get the timestamp for 30 minutes ago

  // check if the valid credentials exist in the OTPs table
  const queryParams = {
    TableName: "OTPs",
    KeyConditionExpression:
      "#email = :email AND #timestamp >= :thirtyMinutesAgo",
    FilterExpression: "#code = :code",
    ExpressionAttributeNames: {
      "#email": "email",
      "#timestamp": "timestamp",
      "#code": "code",
    },
    ExpressionAttributeValues: {
      ":email": email,
      ":thirtyMinutesAgo": thirtyMinutesAgo,
      ":code": code,
    },
  };

  try {
    const result = await dynamoDB.send(new QueryCommand(queryParams));

    if (result.Items && result.Items.length > 0) {
      // save email, password, username, acc_type(sort_key)) to the Users table

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

      await dynamoDB.send(new PutCommand(putParams));

      // Delete all the data associated with the email in OTPs table
      const deletePromises = result.Items.map((item) => {
        const deleteParams = {
          TableName: "OTPs",
          Key: {
            email: item.email,
            timestamp: item.timestamp,
          },
        };
        return dynamoDB.send(new DeleteCommand(deleteParams));
      });

      await Promise.all(deletePromises);

      // generate jwt token for the email
      const token = jwtGenerateToken(email);
      setToken(req, res, token);

      return res.status(200).json({
        status: "success",
        message: "User created successfully",
        token,
      });
    } else {
      // OTP is either incorrect or expired
      return next(
        new AppError("Invalid or expired OTP", 401, "Unauthorized", true)
      );
    }
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

//move the data associated with the email from the OTPs table to the Users table
