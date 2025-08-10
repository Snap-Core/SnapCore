import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Follow from '../types/follow';
import { URLS } from '../config/urls';
import { sendSignedRequest, fetchActorObject } from '../utils/activitypub-utils';
import { findUserByUsername } from '../services/dynamoUserService';
import { LocalUser } from '../types/user';

interface FollowActivity {
  '@context': string;
  id: string;
  type: 'Follow' | 'Accept' | 'Reject' | 'Undo';
  actor: string;
  object: string | {
    id: string;
    type: 'Follow';
    actor: string;
    object: string;
  } | {
    type: string;
    object: string;
  };
}

async function handleFollowActivity(activity: FollowActivity): Promise<{ success: boolean; error?: string }> {
  const { actor, object } = activity;

  try {
    const follow = new Follow({
      actor,
      object: typeof object === 'string' ? object : object.object,
      activityPubObject: activity,
      status: 'pending'
    });

    await follow.save();

    const acceptActivity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${URLS.BACKEND_BASE}/activities/accept-${uuidv4()}`,
      type: 'Accept',
      actor: object,
      object: activity
    };

    const targetActorUrl = typeof object === 'string' ? object : object.object;
    const username = targetActorUrl.split('/').pop();
    const dbUser = await findUserByUsername(username || '');

    if (!dbUser) {
      return { success: false, error: 'Target user not found' };
    }

    const targetUser: LocalUser = {
      username: dbUser.username,
      displayName: dbUser.displayName,
      fediverseId: `${URLS.BACKEND_BASE}/users/${dbUser.username}`,
      publicKey: dbUser.publicKey,
      privateKey: dbUser.encryptedPrivateKey,
      actorUrl: `${URLS.BACKEND_BASE}/users/${dbUser.username}`,
      googleId: dbUser.id,
      userName: dbUser.username,
      email: dbUser.email,
      isFederated: false,
      inbox: `${URLS.BACKEND_BASE}/users/${dbUser.username}/inbox`,
      outbox: `${URLS.BACKEND_BASE}/users/${dbUser.username}/outbox`,
    };

    const followerActor = await fetchActorObject(actor);
    const inboxUrl = followerActor.endpoints?.sharedInbox || followerActor.inbox;

    if (!inboxUrl) {
      return { success: false, error: 'Follower has no inbox URL' };
    }

    await sendSignedRequest(inboxUrl, acceptActivity, targetUser);
    
    follow.status = 'accepted';
    await follow.save();

    return { success: true };
  } catch (error) {
    console.error('Error handling follow:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleAcceptActivity(activity: FollowActivity): Promise<{ success: boolean; error?: string }> {
  try {
    const originalFollow = activity.object as { id: string; actor: string; object: string };
    
    const follow = await Follow.findOne({ 
      'activityPubObject.id': originalFollow.id 
    });

    if (!follow) {
      return { success: false, error: 'Original follow not found' };
    }

    // Update the follow status to accepted
    await Follow.findByIdAndUpdate(follow._id, {
      $set: { status: 'accepted' }
    });

    return { success: true };
  } catch (error) {
    console.error('Error handling accept:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleRejectActivity(activity: FollowActivity): Promise<{ success: boolean; error?: string }> {
  try {
    const originalFollow = activity.object as { id: string; actor: string; object: string };
    
    const follow = await Follow.findOne({ 
      'activityPubObject.id': originalFollow.id 
    });

    if (!follow) {
      return { success: false, error: 'Original follow not found' };
    }

    await Follow.findByIdAndUpdate(follow._id, {
      $set: { status: 'rejected' }
    });

    return { success: true };
  } catch (error) {
    console.error('Error handling reject:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function handleInboxPost(req: Request, res: Response) {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!req.headers.signature) {
        return res.status(401).json({ error: 'Request not signed' });
      }
    }

    const activity = req.body as FollowActivity;

    let result;
    switch (activity.type) {
      case 'Follow':
        result = await handleFollowActivity(activity);
        break;
      case 'Accept':
        result = await handleAcceptActivity(activity);
        break;
      case 'Reject':
        result = await handleRejectActivity(activity);
        break;
      case 'Undo':
        const activityObject = activity.object as { type?: string; object?: string };
        if (activityObject && typeof activityObject === 'object' && activityObject.type === 'Follow') {
          const object = activityObject.object;
          if (!object) {
            return res.status(400).json({ error: 'Invalid Undo Follow format' });
          }
          const undoResult = await Follow.findOneAndDelete({ 
            'activityPubObject.object': object 
          });
          if (!undoResult) {
            return res.status(404).json({ error: 'Follow relationship not found' });
          }
          result = { success: true };
        } else {
          return res.status(400).json({ error: 'Unsupported Undo activity type' });
        }
        break;
      default:
        return res.status(400).json({ error: 'Unsupported activity type' });
    }

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json({ message: 'Activity processed successfully' });
  } catch (error) {
    console.error('Error processing inbox activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
