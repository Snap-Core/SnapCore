//Please utilise this code snippet to get likes by a specific post URL thanks :)
export async function getLikesByPost(postUrl: string) {
  const encodedUrl = encodeURIComponent(postUrl);
  const res = await fetch(`http://localhost:3000/api/likes/${encodedUrl}`);

  if (!res.ok) {
    throw new Error('Failed to fetch likes');
  }

  return res.json();
}