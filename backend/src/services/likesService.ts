import Like from '../types/likes';
import Post from '../types/post';
import { notifyFediverseLike, notifyFediverseUnlike, requestFediverseServer } from '../utils/fediverse-service';
import { isLocalPost } from '../config/urls';

export interface LikeData {
  actor: string;
  object: string;
}

export interface LikeResponse {
  success: boolean;
  message: string;
  like?: any;
}

export class LikesService {

  static async createLike(likeData: LikeData): Promise<LikeResponse> {
    try {
      const { actor, object } = likeData;
      const objectUrl = object?.split('#')[0];

      if (!actor || !objectUrl) {
        return {
          success: false,
          message: 'Missing actor or object URL'
        };
      }

      const isLocal = isLocalPost(objectUrl);

      if (isLocal) {
        return await this.createLocalLike(actor, objectUrl);
      } else {
        return await this.createExternalLike(actor, objectUrl);
      }

    } catch (error: any) {
      console.error('Error creating like:', error);
      return {
        success: false,
        message: 'Internal server error while creating like'
      };
    }
  }

  private static async createLocalLike(actor: string, objectUrl: string): Promise<LikeResponse> {
    const post = await Post.findOne({ 'activityPubObject.id': objectUrl });
    if (!post) {
      return {
        success: false,
        message: 'Post does not exist'
      };
    }

    const existingLike = await Like.findOne({ actor, object: objectUrl });
    if (existingLike) {
      return {
        success: false,
        message: 'Post already liked'
      };
    }

    const activityPubObject = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Like',
      actor,
      object: objectUrl,
      published: new Date().toISOString(),
    };

    const like = new Like({
      actor,
      object: objectUrl,
      activityPubObject,
    });

    await like.save();

    return {
      success: true,
      message: 'Post liked successfully',
      like: like.toObject()
    };
  }

  private static async createExternalLike(actor: string, objectUrl: string): Promise<LikeResponse> {
    try {
      const activityPubObject = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Like',
        actor,
        object: objectUrl,
        published: new Date().toISOString(),
      };

      await notifyFediverseLike({
        actor,
        object: objectUrl,
        activityPubObject,
      });

      return {
        success: true,
        message: 'External post liked successfully'
      };

    } catch (error) {
      console.error('Error liking external post:', error);
      return {
        success: false,
        message: 'Failed to like external post'
      };
    }
  }

  static async removeLike(likeData: LikeData): Promise<LikeResponse> {
    try {
      const { actor, object } = likeData;
      const objectUrl = object?.split('#')[0];

      if (!actor || !objectUrl) {
        return {
          success: false,
          message: 'Missing actor or object URL'
        };
      }

      const isLocal = isLocalPost(objectUrl);

      if (isLocal) {
        return await this.removeLocalLike(actor, objectUrl);
      } else {
        return await this.removeExternalLike(actor, objectUrl);
      }

    } catch (error: any) {
      console.error('Error removing like:', error);
      return {
        success: false,
        message: 'Internal server error while removing like'
      };
    }
  }

  private static async removeLocalLike(actor: string, objectUrl: string): Promise<LikeResponse> {
    const post = await Post.findOne({ 'activityPubObject.id': objectUrl });
    if (!post) {
      return {
        success: false,
        message: 'Post does not exist'
      };
    }

    const deletedLike = await Like.findOneAndDelete({ actor, object: objectUrl });

    if (!deletedLike) {
      return {
        success: false,
        message: 'Like not found'
      };
    }

    return {
      success: true,
      message: 'Like removed successfully'
    };
  }

  private static async removeExternalLike(actor: string, objectUrl: string): Promise<LikeResponse> {
    try {
      await notifyFediverseUnlike({
        actor,
        object: objectUrl,
      });

      return {
        success: true,
        message: 'External post unliked successfully'
      };

    } catch (error) {
      console.error('Error unliking external post:', error);
      return {
        success: false,
        message: 'Failed to unlike external post'
      };
    }
  }

  static async getLikesByPost(postUrl: string): Promise<{ success: boolean; likes?: any[]; totalCount?: number; message?: string }> {
    try {
      const objectUrl = postUrl?.split('#')[0];

      if (!objectUrl) {
        return {
          success: false,
          message: 'Invalid post URL'
        };
      }

      const isLocal = isLocalPost(objectUrl);

      if (!isLocal) {
        return await this.getExternalPostLikes(objectUrl);
      }

      const likes = await Like.find({ object: objectUrl }).sort({ createdAt: -1 });

      return {
        success: true,
        likes: likes.map(like => like.toObject()),
        totalCount: likes.length
      };

    } catch (error: any) {
      console.error('Error fetching likes:', error);
      return {
        success: false,
        message: 'Internal server error while fetching likes'
      };
    }
  }

  static async hasUserLikedPost(actor: string, postUrl: string): Promise<{ success: boolean; liked?: boolean; message?: string }> {
    try {
      const objectUrl = postUrl?.split('#')[0];

      if (!actor || !objectUrl) {
        return {
          success: false,
          message: 'Missing actor or post URL'
        };
      }

      const isLocal = isLocalPost(objectUrl);

      if (!isLocal) {
        return {
          success: false,
          message: 'Cannot check like status for external posts - likes are managed by the origin server'
        };
      }

      const like = await Like.findOne({ actor, object: objectUrl });

      return {
        success: true,
        liked: !!like
      };

    } catch (error: any) {
      console.error('Error checking like status:', error);
      return {
        success: false,
        message: 'Internal server error while checking like status'
      };
    }
  }

  private static async getExternalPostLikes(objectUrl: string): Promise<{ success: boolean; likes?: any[]; totalCount?: number; message?: string }> {
    try {
      const result = await requestFediverseServer('/external/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objectUrl }),
      });

      return {
        success: true,
        likes: result.likes || [],
        totalCount: result.totalCount,
        message: result.message || 'External likes fetched successfully'
      };

    } catch (error) {
      console.error('Error fetching external post likes:', error);
      return {
        success: true,
        likes: [],
        totalCount: 0,
        message: 'Could not fetch external likes - showing empty count'
      };
    }
  }
}
