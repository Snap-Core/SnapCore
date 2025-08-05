import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

export function getDynamoClient() {
  return new DynamoDBClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        sessionToken: process.env.AWS_SESSION_TOKEN || "",
      },
      region: process.env.AWS_REGION || "af-south-1"
    });
}