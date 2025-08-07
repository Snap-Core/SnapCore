import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

export function getDynamoClient() {
  return new DynamoDBClient();
}