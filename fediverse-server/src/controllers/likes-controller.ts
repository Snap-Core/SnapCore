import { Request, Response } from 'express';
import { getExternalServer } from '../utils/external-federated-service';
import { requestBackendServer } from '../utils/backend-service';

export class LikesController {
  static async handleLike(req: Request, res: Response) {
  try {
    const { actor, object, activityPubObject } = req.body;
    
    if (!actor || !object || !activityPubObject) {
      return res.status(400).json({
        error: 'Missing required fields: actor, object, or activityPubObject'
      });
    }

    const objectUrl = new URL(object);
    const targetDomain = objectUrl.hostname;
    
    const actorUsername = actor.split('/').pop(); 
    let actorData;
    
    try {
      actorData = await requestBackendServer(`users/${actorUsername}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      });
    } catch (error) {
      console.error('Could not retrieve actor from backend:', error);
      return res.status(404).json({
        error: 'Actor not found in our system'
      });
    }

      const likeActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Like',
        id: `${actor}/activities/like/${Date.now()}`,
        actor: actor,
        object: object,
        published: new Date().toISOString()
      };

      try {
        const targetActorUrl = await LikesController.discoverActorInbox(objectUrl);
        
        if (targetActorUrl) {
          const response = await getExternalServer(
            new URL(targetActorUrl),
            '',
            new URL(actor),
            actorData.encryptedPrivateKey, 
            true,
            'POST',
            likeActivity
          );

          if (!response.ok) {
            const responseText = await response.text();
            console.warn(`Failed to send like activity to ${targetDomain}:`, response.status, responseText);
          }
        } else {
          console.warn('No target actor URL found for federation');
        }
      } catch (federationError) {
        console.error('Federation error while sending like:', federationError);
      }

      return res.status(202).json({
        message: 'Like activity accepted and processed',
        activity: likeActivity
      });

    } catch (error) {
      console.error('Error processing like activity:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return res.status(500).json({
        error: 'Internal server error while processing like activity'
      });
    }
  }

  static async handleUnlike(req: Request, res: Response) {
    try {
      const { actor, object } = req.body;

      if (!actor || !object) {
        return res.status(400).json({
          error: 'Missing required fields: actor and object'
        });
      }

      const objectUrl = new URL(object);
      const targetDomain = objectUrl.hostname;
      
      const actorUsername = actor.split('/').pop();
      let actorData;
      
      try {
        actorData = await requestBackendServer(`users/${actorUsername}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/activity+json',
          },
        });
      } catch (error) {
        console.error('Could not retrieve actor from backend:', error);
        return res.status(404).json({
          error: 'Actor not found in our system'
        });
      }

      const undoActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Undo',
        id: `${actor}/activities/undo/${Date.now()}`,
        actor: actor,
        object: {
          type: 'Like',
          actor: actor,
          object: object
        },
        published: new Date().toISOString()
      };

      try {
        const targetActorUrl = await LikesController.discoverActorInbox(objectUrl);
        
        if (targetActorUrl) {
          const response = await getExternalServer(
            new URL(targetActorUrl),
            '',
            new URL(actor),
            actorData.encryptedPrivateKey,
            true
          );

          if (response.ok) {
            // Success - like sent
          } else {
            console.warn(`Failed to send undo like activity to ${targetDomain}:`, response.status);
          }
        }
      } catch (federationError) {
        console.error('Federation error while sending unlike:', federationError);
      }

      return res.status(202).json({
        message: 'Unlike activity accepted and processed',
        activity: undoActivity
      });

    } catch (error) {
      console.error('Error processing unlike activity:', error);
      return res.status(500).json({
        error: 'Internal server error while processing unlike activity'
      });
    }
  }

  static async handleIncomingLike(activity: any): Promise<void> {
    try {
      if (!activity.type || !activity.actor || !activity.object) {
        console.error('Invalid activity structure');
        return;
      }

      try {
        await requestBackendServer('likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actor: activity.actor,
            object: activity.object
          })
        });

      } catch (error) {
        console.error('Error forwarding incoming like to backend:', error);
      }

    } catch (error) {
      console.error('Error processing incoming like activity:', error);
    }
  }

  private static async discoverActorInbox(objectUrl: URL): Promise<string | null> {
    try {
      const objectResponse = await getExternalServer(objectUrl, '');
      
      if (objectResponse.ok) {
        const objectData = await objectResponse.json();
        
        if (objectData.attributedTo) {
          const actorResponse = await getExternalServer(new URL(objectData.attributedTo), '');
          
          if (actorResponse.ok) {
            const actorData = await actorResponse.json();
            return actorData.inbox || null;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error discovering actor inbox:', error);
      return null;
    }
  }

  static async getExternalLikes(req: Request, res: Response) {
    try {
      const { objectUrl } = req.body;

      if (!objectUrl) {
        return res.status(400).json({
          error: 'Missing objectUrl parameter'
        });
      }

      const postUrl = new URL(objectUrl);
      const response = await getExternalServer(postUrl, '');

      if (!response.ok) {
        return res.status(200).json({
          likes: [],
          totalCount: 0,
          message: 'Could not fetch external post data'
        });
      }

      const postData = await response.json();

      let likesCollection = null;
      if (postData.likes) {
        likesCollection = postData.likes;
      } else if (postData.object && postData.object.likes) {
        likesCollection = postData.object.likes;
      }

      if (!likesCollection) {
        return res.status(200).json({
          likes: [],
          totalCount: 0,
          message: 'No likes collection found for this post'
        });
      }

      if (likesCollection.totalItems !== undefined) {
        return res.status(200).json({
          likes: [],
          totalCount: likesCollection.totalItems,
          message: `Found ${likesCollection.totalItems} likes on external post`
        });
      }

      if (typeof likesCollection === 'string') {
        try {
          const likesUrl = new URL(likesCollection);
          const likesResponse = await getExternalServer(likesUrl, '');
          
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            
            let likes = [];
            if (likesData.totalItems !== undefined) {
              likes = likesData.orderedItems || likesData.items || [];
              
              if (Array.isArray(likes)) {
                return res.status(200).json({
                  likes: likes,
                  totalCount: likesData.totalItems || likes.length,
                  message: 'External likes fetched successfully'
                });
              } else if (likesData.totalItems) {
                return res.status(200).json({
                  likes: [], 
                  totalCount: likesData.totalItems,
                  message: `Found ${likesData.totalItems} likes on external post`
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching likes collection:', error);
        }
      }

      return res.status(200).json({
        likes: [],
        totalCount: 0,
        message: 'Could not determine likes count for external post'
      });

    } catch (error) {
      console.error('Error fetching external likes:', error);
      return res.status(500).json({
        error: 'Internal server error while fetching external likes'
      });
    }
  }
}

export const handleLike = LikesController.handleLike;
export const getExternalLikes = LikesController.getExternalLikes;
