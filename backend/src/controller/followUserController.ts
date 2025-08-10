import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import Follow from "../types/follow";
import { User } from "../types/user";
import { URLS } from "../config/urls";
import { fetchActorObject, sendSignedRequest, buildActorUrl } from "../utils/activitypub-utils";

export const followUser = async (req: Request & { user?: User }, res: Response) => {
  const { object } = req.body;
  const currentUser = req.user;

  if (!object || !currentUser) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const actor = buildActorUrl(currentUser.username);

  try {
    const targetActor = await fetchActorObject(object);
    const inboxUrl = targetActor.endpoints?.sharedInbox || targetActor.inbox;

    if (!inboxUrl) {
      throw new Error("Target user has no inbox URL");
    }

    const followActivity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `${URLS.BACKEND_BASE}/activities/${uuidv4()}`,
      type: "Follow",
      actor,
      object: targetActor.id
    };

    const follow = new Follow({
      actor,
      object: targetActor.id,
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

    // If it's a remote user, send the signed follow activity to their inbox
    if (!targetActor.id.startsWith(URLS.BACKEND_BASE)) {
      try {
        await sendSignedRequest(inboxUrl, followActivity, currentUser);
      } catch (error) {
        console.error("Failed to send follow activity:", error);
        // We still want to keep the local follow record even if remote notification fails
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
