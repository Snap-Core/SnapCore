import { v4 as uuidv4 } from "uuid";
import Follow from "../types/follow";
import fetch from "node-fetch";
import { requestFediverseServer } from "../utils/fediverse-service";


interface ActivityPubActor {
  id: string;
  inbox?: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

export async function handleLocalFollow(actor: string, object: string) {
  try {
    const follow = new Follow({
      actor,
      object,
      activityPubObject: {
        type: "Follow",
        actor,
        object
      }
    });
    await follow.save();
    return { success: true, follow };
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new Error("Already following this user");
    }
    throw error;
  }
}

export async function handleFederatedFollow(actor: string, object: string) {
  try {
    const targetActorUrl = new URL(object);
    const remoteActor = await requestFediverseServer(`/external-actor?url=${encodeURIComponent(targetActorUrl.toString())}`) as ActivityPubActor;
    
    if (!remoteActor.inbox) {
      throw new Error("Remote user has no inbox");
    }

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
    await follow.save();

    const response = await fetch(remoteActor.inbox, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/activity+json'
      },
      body: JSON.stringify(followActivity)
    });

    if (!response.ok) {
      throw new Error(`Failed to send follow activity: ${response.statusText}`);
    }

    return { success: true, follow };
  } catch (error) {
    throw new Error(`Failed to follow federated user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handleUnfollow(actor: string, object: string) {
  try {
    const result = await Follow.deleteOne({ actor, object });
    if (result.deletedCount === 0) {
      throw new Error("Follow relationship not found");
    }
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to unfollow user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getFollows(actor?: string) {
  try {
    const query = actor ? { actor } : {};
    return await Follow.find(query);
  } catch (error) {
    throw new Error(`Failed to get follows: ${error instanceof Error ? error.message : String(error)}`);
  }
}
