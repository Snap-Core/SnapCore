//Please utilise this code snippet to get likes by a specific post URL thanks :)
export async function getLikesByPost(postUrl: string) {
  const encodedUrl = encodeURIComponent(postUrl);
  const res = await fetch(`http://localhost:3000/api/likes/${encodedUrl}`);

  if (!res.ok) {
    throw new Error("Failed to fetch likes");
  }

  return res.json();
}

export const likePost = async (params: { actor: string; object: string }) => {
  try {
    const response = await fetch("http://localhost:3000/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to like post: ${response.status} ${errorText}`);
    } else {
      console.log("Successfully liked the post!");
    }

    return await response.json();
  } catch (err) {
    console.error("Error in likePost:", err);
    throw err;
  }
};

export const unlikePost = async (params: { actor: string; object: string }) => {
  try {
    const response = await fetch("http://localhost:3000/api/likes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to unlike post: ${response.status} ${errorText}`);
    } else {
      console.log("Successfully unliked the post!");
    }

    return await response.json();
  } catch (err) {
    console.error("Error in unlikePost:", err);
    throw err;
  }
};
