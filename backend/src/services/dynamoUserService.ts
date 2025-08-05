import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { GoogleUserInfo } from "../types/AuthTypes";
import dotenv from 'dotenv';
import {generateKeyPair} from "../utils/key-pair-generation";

dotenv.config();

let client: DynamoDBClient | null = null;
function getDynamoClient() {
  if (!client) {
    client = new DynamoDBClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        sessionToken: process.env.AWS_SESSION_TOKEN || "",
      },
      region: process.env.AWS_REGION || "af-south-1"
    });
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
  if (existing) return {existing, isExisting: true};

  const [publicKey, encryptedPrivateKey] = await generateKeyPair()

  const cmd = new PutCommand({
    TableName: tableName,
    Item: {
      id: user.sub,
      name: user.name,
      email: user.email,
      activated: false,
      createdAt: new Date().toISOString(),
      publicKey: publicKey,
      encryptedPrivateKey: encryptedPrivateKey
    },
    ConditionExpression: "attribute_not_exists(id)",
  });

  await getDynamoClient().send(cmd);
  return { id: user.sub, name: user.name, email: user.email, isExisting: false };
}

export async function findUserByUsername(username: string) {
  const cmd = new ScanCommand({
    TableName: tableName,
    FilterExpression: "#un = :username_lowercase",
    ExpressionAttributeNames: { "#un": "username_lowercase" },
    ExpressionAttributeValues: { ":username_lowercase": username.toLowerCase() },
  });
  const result = await getDynamoClient().send(cmd);
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

export async function updateUser(
  id: string,
  updates: Partial<{ displayName: string; username: string; summary: string; activated: boolean }>
) {
  if (
    updates.username &&
    (updates.username.length < 3 || updates.username.length > 20)
  ) throw new Error("Username must be 3-20 characters.");

  if (updates.username) {
    const existingUser = await findUserByUsername(updates.username);
    if (existingUser && existingUser.id !== id) {
      throw new Error("Username already taken.");
    }
  }

  if (
    updates.displayName &&
    (updates.displayName.length < 3 || updates.displayName.length > 30)
  ) throw new Error("Display name must be 3-30 characters.");
  if (
    updates.summary &&
    (updates.summary.length < 10 || updates.summary.length > 160)
  ) throw new Error("Bio must be 10-160 characters.");

  const current = await findUserById(id);

  const updateExpr = [];
  const exprAttrNames: Record<string, string> = {};
  const exprAttrValues: Record<string, any> = {};

  let hasDisplayName = !!(updates.displayName || current?.displayName);
  let hasUsername = !!(updates.username || current?.username);
  let hasSummary = !!(updates.summary || current?.summary);

  if (updates.displayName) {
    updateExpr.push("#dn = :displayName");
    exprAttrNames["#dn"] = "displayName";
    exprAttrValues[":displayName"] = updates.displayName;
    hasDisplayName = true;
  }
  if (updates.username) {
    updateExpr.push("#un = :username");
    exprAttrNames["#un"] = "username";
    exprAttrValues[":username"] = updates.username;
    hasUsername = true;

    updateExpr.push("#un = :username_lowercase");
    exprAttrNames["#un"] = "username_lowercase";
    exprAttrValues[":username_lowercase"] = updates.username.toLowerCase();
  }
  if (updates.summary) {
    updateExpr.push("#sm = :summary");
    exprAttrNames["#sm"] = "summary";
    exprAttrValues[":summary"] = updates.summary;
    hasSummary = true;
  }

  let activated: boolean | undefined = updates.activated;
  if (typeof activated === "undefined") {
    activated = hasDisplayName && hasUsername && hasSummary;
  }

  updateExpr.push("#act = :activated");
  exprAttrNames["#act"] = "activated";
  exprAttrValues[":activated"] = activated;

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

export async function scanUsers() {
  const cmd = new ScanCommand({ TableName: tableName });
  const result = await getDynamoClient().send(cmd);
  return (result.Items || []).map(({ id, email, ...rest }) => rest);
}
