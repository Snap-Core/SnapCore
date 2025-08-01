
//Please utilise this code snippet to get posts by a specific actor URL thanks :)
export const getPostsByActor = async (actorUrl: string) => {
  const encoded = encodeURIComponent(actorUrl);

  const res = await fetch(`/api/posts/actor/${encoded}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch posts for actor: ${actorUrl}`);
  }
  return await res.json();
};