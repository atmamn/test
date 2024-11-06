import * as http from "http";
import * as https from "https"; // Import https module
import { ResVerifyPayment } from "../../../../types/paystack/resVerifyPayment";

type VerifyProps = {
  referenceID: string;
};

export const verify = ({
  referenceID,
}: VerifyProps): Promise<ResVerifyPayment> => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${referenceID}`,
      method: "GET",
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
          const responseData: ResVerifyPayment = JSON.parse(data);
          resolve(responseData);
        });
      })
      .on("error", (error) => {
        console.error(error);
        reject(error);
      });

    reqpaystack.end();
  });
};
