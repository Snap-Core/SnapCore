import { useCallback, useState } from 'react';
import { likePost, unlikePost, getLikesByPost } from '../services/likeService';
import { isLocalPost } from '../utils/postUtils';
import { useToast } from '../components/ToastContext';

interface UseLikesOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useLikes = (options: UseLikesOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLike = useCallback(async (
    actor: string, 
    objectUrl: string,
    currentlyLiked: boolean = false
  ) => {
    if (!actor || !objectUrl) {
      const errorMsg = 'Missing required information to like post';
      options.onError?.(errorMsg);
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    
    try {
      if (currentlyLiked) {
        await unlikePost({ actor, object: objectUrl });
        const successMsg = 'Post unliked';
        options.onSuccess?.(successMsg);
        showToast(successMsg, 'success');
      } else {
        await likePost({ actor, object: objectUrl });
        const successMsg = isLocalPost(objectUrl) 
          ? 'Post liked' 
          : 'Like sent to external server';
        options.onSuccess?.(successMsg);
        showToast(successMsg, 'success');
      }
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to toggle like';
      options.onError?.(errorMsg);
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [options, showToast]);

  const fetchLikes = useCallback(async (postUrl: string) => {
    setLoading(true);
    
    try {
      const response = await getLikesByPost(postUrl);
      return { success: true, likes: response.likes || [] };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch likes';
      options.onError?.(errorMsg);
      return { success: false, error: errorMsg, likes: [] };
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    handleLike,
    fetchLikes,
    loading
  };
};
