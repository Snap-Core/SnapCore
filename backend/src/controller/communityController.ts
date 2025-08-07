import { Request, Response } from "express";
import dotenv from "dotenv";
import {requestFediverseServer} from "../utils/fediverse-service";
import {generateKeyPair} from "../utils/key-pair-generation";
import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {DynamoDBClient, PutItemCommand, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {Community} from "../types/community";
import {CreateCommunity} from "../types/createCommunity";
import {now} from "mongoose";
import { getDynamoClient } from "../middleware/dynamoDbClient";
import { Community } from "../types/community";

dotenv.config();

const backendServerUrl : URL = new URL(process.env.BACKEND_SERVER_URL as string);
const client : DynamoDBClient = getDynamoClient();
const dynamoDbTableName : string = process.env.DYNAMODB_TABLE!;
const usernameIndexName : string = process.env.USERNAME_INDEX_NAME!;

export const createCommunity = async (req: Request, res: Response) => {
  let createCommunity: CreateCommunity;
  try {
    createCommunity = req.body;
  } catch (error) {
    return res.status(400).json({ error: 'To create a community, you need to provide the community handle and the community display name' });
  }

  const [publicKey, encryptedPrivateKey] = await generateKeyPair()

  const community : Community = {
    ...createCommunity,
    fediverseId: `${backendServerUrl}community/${req.body.handle}`,
    created: now(),
    updated: now(),
    publicKey: publicKey,
    encryptedPrivateKey: encryptedPrivateKey
  };

  const {handle: username, ...rest} = community;

  const params = {
    TableName: dynamoDbTableName,
    Item: marshall({ username, ...rest }),
    ConditionExpression: "attribute_not_exists(username)", // Ensures no duplicate username
  };

  try {
    await client.send(new PutItemCommand(params));
    return res.status(201).json(community);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(400).json("Handle is already in use.");
    } else {
      return res.status(500).json("Error occurred when trying to save community.");
    }
  }
}

export const updateCommunity = async (req: Request, res: Response) => {
  const communityHandle = req.params.communityHandle;
  const updates : Record<string, string> = req.body;

  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {};

  for (const key of Object.keys(updates)) {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = updates[key];
    expressionAttributeNames[`#${key}`] = key;
  }

  const params = {
    TableName: dynamoDbTableName,
    Key: marshall({ communityHandle }),
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValue: "ALL_NEW",
  };

  try {
    const result = await client.send(new UpdateItemCommand(params));
    return result.Attributes;
  } catch (error) {
    return res.status(500).json("Error occurred when trying to update community.");
  }
};

export const getCommunityByHandle = async (req: Request, res: Response) => {
  const handle = req.params.handle;


  const params = {
    TableName: dynamoDbTableName,
    IndexName: usernameIndexName,
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": { S: handle },
    },
    Limit: 1
  };

  try {
    const result = await client.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
      const community : Community = unmarshall(result.Items[0]) as Community;
      return res.status(200).json(community);
    } else {
      return res.status(404).json("Community Not Found");
    }
  } catch (error) {
    return res.status(500).json("Error occurred when trying to retrieve community.");
  }
}

export const getExternalCommunityFromHandle = async (req: Request, res: Response) => {
  const { handle, domain } = req.query as { handle: string; domain: string };

  if (!handle || !domain) {
    return res.status(400).json({ error: 'Invalid get external community request' });
  }

  let community : Community ;
  try {
    community = await requestFediverseServer(
      `groups/external?handle=${handle}&domain=${domain}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      });
  } catch (error) {
    return res.status(500).json('Could not retrieve community from fediverse server: ' + error);
  }

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(community);
};