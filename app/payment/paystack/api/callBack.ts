import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextFunction, Request, Response } from "express";
import { dynamoDB } from "../../../../db/dal";
import { THIRTYDAYS } from "../../../../lib/constants/dates";
import { AppError } from "../../../../lib/error";
import { verify } from "./verify";
export const callback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { reference: referenceID } = req.query as {
    reference: string;
  };

  try {
    const response = await verify({ referenceID });

    if (response.data.status === "success") {
      const { email } = response.data.customer;
      const { reference: referenceID } = response.data;
      const metadata = response.data.metadata;

      let userPlan = "";
      let accType = "";
      if (
        typeof metadata !== "string" &&
        metadata.userPlan &&
        metadata.accType
      ) {
        userPlan = metadata.userPlan;
        accType = metadata.accType;
      } else {
        // Handle the case where metadata is a string or userPlan doesn't exist
        return next(
          new AppError("Client error", 400, "Invalid metadata format", true)
        );
      }

      // acc_type and userPlan will come from the response

      // Update a user via email and add the plan to their item
      const updateParams = {
        TableName: "Users",
        Key: {
          email: email,
          acc_type: accType, // Replace "email" with the correct acc_type
        },
        UpdateExpression:
          "set userPlan = :userPlan, expiresIn = :expiresIn, referenceID = :referenceID",
        ExpressionAttributeValues: {
          ":userPlan": userPlan,
          ":expiresIn": THIRTYDAYS,
          ":referenceID": referenceID,
        },
        ReturnValues: ReturnValue.UPDATED_NEW,
      };

      await dynamoDB.send(new UpdateCommand(updateParams));

      // Send a success response
      res.status(200).json({
        status: "success",
      });
    } else {
      return next(
        new AppError("Invalid payment status", 400, "Bad Request", true)
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
