import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GoogleUserInfo } from "../types/AuthTypes";
import dotenv from 'dotenv';
import {generateKeyPair} from "../utils/key-pair-generation";

dotenv.config();

let client: DynamoDBClient | null = null;
function getDynamoClient() {
  if (!client) {
    client = new DynamoDBClient();
  }
  return client;
}

const tableName = process.env.DYNAMODB_TABLE || "accounts";

export async function findUserById(id: string) {
  const cmd = new GetCommand({
    TableName: tableName,
    Key: { id },
  });
  const result = await getDynamoClient().send(cmd);
  return result.Item;
}

export async function createUserIfNotExists(user: GoogleUserInfo) {
  const existing = await findUserById(user.sub);
  if (existing) return existing;

  const [publicKey, encryptedPrivateKey] = await generateKeyPair()

  const cmd = new PutCommand({
    TableName: tableName,
    Item: {
      id: user.sub,
      name: user.name,
      email: user.email,
      createdAt: new Date().toISOString(),
      publicKey: publicKey,
      encryptedPrivateKey: encryptedPrivateKey
    },
    ConditionExpression: "attribute_not_exists(id)",
  });

  await getDynamoClient().send(cmd);
  return { id: user.sub, name: user.name, email: user.email };
}

export async function updateUser(id: string, updates: Partial<{ name: string; email: string }>) {
  const updateExpr = [];
  const exprAttrNames: Record<string, string> = {};
  const exprAttrValues: Record<string, any> = {};

  if (updates.name) {
    updateExpr.push("#n = :name");
    exprAttrNames["#n"] = "name";
    exprAttrValues[":name"] = updates.name;
  }
  if (updates.email) {
    updateExpr.push("#e = :email");
    exprAttrNames["#e"] = "email";
    exprAttrValues[":email"] = updates.email;
  }

  if (updateExpr.length === 0) return null;

  const cmd = new UpdateCommand({
    TableName: tableName,
    Key: { id },
    UpdateExpression: `SET ${updateExpr.join(", ")}`,
    ExpressionAttributeNames: exprAttrNames,
    ExpressionAttributeValues: exprAttrValues,
    ReturnValues: "ALL_NEW",
  });

  const result = await getDynamoClient().send(cmd);
  return result.Attributes;
}