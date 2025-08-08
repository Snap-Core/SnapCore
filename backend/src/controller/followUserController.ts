import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { requestFediverseServer } from "../utils/fediverse-service";
import Follow from "../types/follow";
import { User } from "../types/user";
import fetch from "node-fetch";

interface ActivityPubActor {
  id: string;
  inbox?: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

export const followUser = async (req: Request & { user?: User }, res: Response) => {
  const { object } = req.body;
  const currentUser = req.user;

  if (!object || !currentUser) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const actor = `https://${process.env.DOMAIN}/users/${currentUser.username}`;

  try {
    const followActivity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `https://${process.env.DOMAIN}/activities/${uuidv4()}`,
      type: "Follow",
      actor,
      object
    };

    const follow = new Follow({
      actor,
      object,
      activityPubObject: followActivity
    });

    try {
      await follow.save();
    } catch (error) {
      const err = error as any;
      if (err?.code === 11000) { 
        return res.status(400).json({ message: "Already following this user" });
      }
      throw error;
    }

    if (!object.startsWith(`https://${process.env.DOMAIN}`)) {
      try {
        const targetActorUrl = new URL(object);
        // Extract username and domain from the actor URL or handle
        const [username, domain] = object.includes('@') 
          ? object.split('@') 
          : [targetActorUrl.pathname.split('/').pop(), targetActorUrl.hostname];

        const remoteActor = await requestFediverseServer(`/users/external?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`);
          
        if (!remoteActor.inbox) {
          throw new Error("Remote user has no inbox");
        }

        const response = await fetch(remoteActor.inbox, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/activity+json',
            'Accept': 'application/activity+json'
          },
          body: JSON.stringify(followActivity)
        });

        if (!response.ok) {
          throw new Error(`Failed to send follow activity: ${response.statusText}`);
        }
      } catch (error) {
        console.warn("Failed to notify remote server of follow:", error);
      }
    }

    return res.status(200).json({ message: "Follow request sent", follow });
  } catch (error) {
    console.error("Follow error:", error);
    return res.status(500).json({ 
      message: "Failed to follow user", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

export const unfollowUser = async (req: Request & { user?: User }, res: Response) => {
  const { actor, object } = req.body;
  const currentUser = req.user;

  if (!object || !currentUser) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const actorUrl = `https://${process.env.DOMAIN}/users/${currentUser.username}`;

  try {
    const result = await Follow.findOneAndDelete({ 
      actor: actorUrl,
      object 
    });
    
    if (!result) {
      return res.status(404).json({ message: "Follow relationship not found" });
    }
    return res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    return res.status(500).json({ 
      message: "Failed to unfollow user", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

export const getFollows = async (req: Request & { user?: User }, res: Response) => {
  const { actor, object } = req.query as { actor?: string; object?: string };
  const query: any = {};

  if (actor) query.actor = actor;
  if (object) query.object = object;

  try {
    const follows = await Follow.find(query);
    return res.status(200).json(follows);
  } catch (error) {
    console.error("Get follows error:", error);
    return res.status(500).json({ 
      message: "Failed to get follows", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
