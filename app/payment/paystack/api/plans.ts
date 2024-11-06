import { Request, Response } from "express";
import * as https from "https"; // Import https module
import * as http from "http";
import { BASEURL } from "../../../../lib/constants/severURL";

export const oneMonth = (req: Request, res: Response): void => {
  const params = JSON.stringify({
    email: req.query.email,
    amount: req.query.amount,
    plan: "PLN_paegmb6whxr8fp3",
    metadata: {
      userPlan: "basic",
      accType: req.query.accType,
      cancel_action: `${BASEURL}/paystack/cancelurl`,
    },
    callback_url: `${BASEURL}/paystack/callbackx`,
  });

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/initialize",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_LIVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  };

  const reqpaystack = https
    .request(options, (respaystack: http.IncomingMessage) => {
      let data = "";

      respaystack.on("data", (chunk) => {
        data += chunk;
      });

      respaystack.on("end", () => {
        res.send(data);
      });
    })
    .on("error", (error) => {
      console.error(error);
    });

  reqpaystack.write(params);
  reqpaystack.end();
};
