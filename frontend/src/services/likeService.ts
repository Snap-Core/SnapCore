import { fetcher } from "../utils/fetcher";

interface ApiError {
  status: number;
  message?: string;
}

export async function getLikesByPost(postUrl: string) {
  const encodedUrl = encodeURIComponent(postUrl);
  return fetcher(`/likes/${encodedUrl}`);
}

export const likePost = async (params: { actor: string; object: string }) => {
  try {
    const response = await fetcher("/likes", {
      method: "POST",
      body: params,
    });

    return response;
  } catch (err) {
    console.error("Error in likePost:", err);
    
    const error = err as ApiError;
    
    if (error.status === 409) {
      throw new Error("Post already liked");
    } else if (error.status === 404) {
      throw new Error("Post not found");
    } else if (error.status === 400) {
      throw new Error("Invalid like request");
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error("Failed to like post");
  }
};

export const unlikePost = async (params: { actor: string; object: string }) => {
  try {
    const response = await fetcher("/likes", {
      method: "DELETE",
      body: params,
    });

    return response;
  } catch (err) {
    console.error("Error in unlikePost:", err);
    
    const error = err as ApiError;
    
    if (error.status === 410) {
      throw new Error("Like not found");
    } else if (error.status === 404) {
      throw new Error("Post not found");
    } else if (error.status === 400) {
      throw new Error("Invalid unlike request");
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error("Failed to unlike post");
  }
};

export const checkUserLike = async (actor: string, postUrl: string) => {
  const encodedActor = encodeURIComponent(actor);
  const encodedPostUrl = encodeURIComponent(postUrl);
  
  try {
    return await fetcher(`/likes/check/${encodedActor}/${encodedPostUrl}`);
  } catch (err) {
    console.error("Error checking like status:", err);
    
    const error = err as ApiError;
    
    if (error.status === 400) {
      throw new Error("Cannot check like status for external posts");
    }
    
    throw new Error("Failed to check like status");
  }
};
