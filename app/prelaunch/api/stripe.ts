import express, { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { AppError } from "../../../lib/error";
import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { THIRTYDAYS } from "../../../lib/constants/dates";
import { dynamoDB } from "../../../db/dal";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

// @ts-expect-error Stripe constructor expects a string literal, but we're using an environment variable
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

interface BodyProps {
  paymentMethodId: string;
  customerId: string;
  priceId: string;
  email: string;
  userPlan: string;
}

export const stripeSubscription: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentMethodId, customerId, priceId, email, userPlan }: BodyProps =
      req.body;

    // If no customer ID is passed, create a new customer
    let customer;
    if (!customerId) {
      customer = await stripe.customers.create({
        payment_method: paymentMethodId, // attach payment method during customer creation
      });
    } else {
      customer = await stripe.customers.retrieve(customerId);
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ["latest_invoice.payment_intent"],
    });

    if (!subscription) {
      return next(
        new AppError(
          "Internal server error",
          500,
          "Failed to create subscription",
          true
        )
      );
    }

    // Update params
    const updateParams = {
      TableName: "Users",
      Key: {
        email: email,
        acc_type: "email", // Replace "email" with the correct acc_type
      },
      UpdateExpression:
        "set userPlan = :userPlan, expiresIn = :expiresIn, referenceID = :referenceID",
      ExpressionAttributeValues: {
        ":userPlan": userPlan,
        ":expiresIn": THIRTYDAYS,
        ":referenceID": subscription.id,
      },
      ReturnValues: ReturnValue.UPDATED_NEW,
    };

    // Update the Users table with the subscription ID and plan details
    await dynamoDB.send(new UpdateCommand(updateParams));

    res.status(200).send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      paymentIntentStatus: subscription.latest_invoice.payment_intent.status,
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
